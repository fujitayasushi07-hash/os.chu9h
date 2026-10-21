begin;

create table public.recovery_fund_donation_intents (
    id uuid primary key default gen_random_uuid(),
    wallet text not null
        check (wallet ~ '^0x[0-9a-f]{40}$'),
    usd_amount_cents integer not null
        check (usd_amount_cents between 50 and 61400),
    amount_raw text not null
        check (
            amount_raw ~ '^[0-9]{1,78}$'
            and amount_raw::numeric > 0
        ),
    quote_price_usd numeric not null check (quote_price_usd > 0),
    quote_timestamp timestamptz not null,
    created_at timestamptz not null default now(),
    expires_at timestamptz not null,
    consumed_at timestamptz,
    check (expires_at > created_at)
);

create index recovery_fund_donation_intents_expires_at_idx
    on public.recovery_fund_donation_intents (expires_at)
    where consumed_at is null;

alter table public.recovery_fund_donations
    add column intent_id uuid
        references public.recovery_fund_donation_intents (id),
    add column usd_amount_cents integer
        check (usd_amount_cents between 50 and 61400),
    add constraint recovery_fund_feature_donation_amount_check
        check (intent_id is null or usd_amount_cents is not null);

create unique index recovery_fund_donations_intent_id_key
    on public.recovery_fund_donations (intent_id)
    where intent_id is not null;

drop table if exists public.recovery_fund_scan_state;

alter table public.recovery_fund_donation_intents enable row level security;
revoke all on table public.recovery_fund_donation_intents
    from public, anon, authenticated, service_role;
grant select, insert on table public.recovery_fund_donation_intents
    to service_role;
grant delete on table public.recovery_fund_donation_intents to service_role;

create function public.record_recovery_fund_donation(
    p_intent_id uuid,
    p_tx_hash text,
    p_log_index integer,
    p_sender text,
    p_amount_raw text,
    p_block_number bigint,
    p_block_hash text,
    p_block_timestamp timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
    v_intent public.recovery_fund_donation_intents%rowtype;
    v_existing public.recovery_fund_donations%rowtype;
    v_inserted integer;
begin
    if p_intent_id is null
        or p_tx_hash is null
        or p_tx_hash !~ '^0x[0-9a-f]{64}$'
        or p_log_index is null
        or p_log_index < 0
        or p_sender is null
        or p_sender !~ '^0x[0-9a-f]{40}$'
        or p_amount_raw is null
        or p_amount_raw !~ '^[0-9]{1,78}$'
        or p_amount_raw::numeric <= 0
        or p_block_number is null
        or p_block_number < 37998426
        or p_block_hash is null
        or p_block_hash !~ '^0x[0-9a-f]{64}$'
        or p_block_timestamp is null then
        raise exception 'Invalid verified donation data'
            using errcode = '22023';
    end if;

    select *
    into v_intent
    from public.recovery_fund_donation_intents
    where id = p_intent_id
    for update;

    if not found then
        raise exception 'Donation intent not found'
            using errcode = '22023';
    end if;

    if v_intent.wallet <> p_sender
    or v_intent.amount_raw <> p_amount_raw
    or p_block_timestamp < v_intent.created_at
    or p_block_timestamp > v_intent.expires_at then
    raise exception 'Transaction does not match donation intent'
        using errcode = '22023';
end if;

if v_intent.expires_at <= pg_catalog.clock_timestamp() then
    raise exception 'Donation intent has expired'
        using errcode = '22023';
end if;

    if v_intent.consumed_at is not null then
        select *
        into v_existing
        from public.recovery_fund_donations
        where intent_id = p_intent_id;

        if found
            and v_existing.tx_hash = p_tx_hash
            and v_existing.log_index = p_log_index then
            return pg_catalog.jsonb_build_object(
                'recorded', true,
                'duplicate', true
            );
        end if;

        raise exception 'Donation intent has already been used'
            using errcode = '23505';
    end if;

    insert into public.recovery_fund_donations (
        chain_id,
        tx_hash,
        log_index,
        token_contract,
        recipient,
        sender,
        amount_raw,
        block_number,
        block_hash,
        block_timestamp,
        verified,
        verified_at,
        intent_id,
        usd_amount_cents
    )
    values (
        143,
        p_tx_hash,
        p_log_index,
        '0x350035555e10d9afaf1566aaebfced5ba6c27777',
        '0x48a22f7683a8541292e1eed3c68110cd7e4b39be',
        p_sender,
        p_amount_raw,
        p_block_number,
        p_block_hash,
        p_block_timestamp,
        true,
        pg_catalog.clock_timestamp(),
        p_intent_id,
        v_intent.usd_amount_cents
    )
    on conflict (chain_id, tx_hash, log_index) do nothing;

    get diagnostics v_inserted = row_count;
    if v_inserted = 0 then
        select *
        into v_existing
        from public.recovery_fund_donations
        where intent_id = p_intent_id;

        if found
            and v_existing.tx_hash = p_tx_hash
            and v_existing.log_index = p_log_index then
            update public.recovery_fund_donation_intents
            set consumed_at = pg_catalog.clock_timestamp()
            where id = p_intent_id;

            return pg_catalog.jsonb_build_object(
                'recorded', true,
                'duplicate', true
            );
        end if;

        raise exception 'Transaction has already been recorded'
            using errcode = '23505';
    end if;

    update public.recovery_fund_donation_intents
    set consumed_at = pg_catalog.clock_timestamp()
    where id = p_intent_id;

    return pg_catalog.jsonb_build_object(
        'recorded', true,
        'duplicate', false
    );
end;
$function$;

revoke all on function public.record_recovery_fund_donation(
    uuid, text, integer, text, text, bigint, text, timestamptz
) from public, anon, authenticated, service_role;
grant execute on function public.record_recovery_fund_donation(
    uuid, text, integer, text, text, bigint, text, timestamptz
) to service_role;

create or replace function public.recovery_fund_public_summary()
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog
as $function$
    select pg_catalog.jsonb_build_object(
        'totalAmountRaw',
        coalesce((
            select pg_catalog.sum(d.amount_raw::numeric)::text
            from public.recovery_fund_donations as d
            where d.intent_id is not null
                and d.chain_id = 143
                and d.token_contract = '0x350035555e10d9afaf1566aaebfced5ba6c27777'
                and d.recipient = '0x48a22f7683a8541292e1eed3c68110cd7e4b39be'
                and d.verified is true
        ), '0'),
        'totalUsdCents',
        coalesce((
            select pg_catalog.sum(d.usd_amount_cents)::text
            from public.recovery_fund_donations as d
            where d.intent_id is not null
                and d.chain_id = 143
                and d.token_contract = '0x350035555e10d9afaf1566aaebfced5ba6c27777'
                and d.recipient = '0x48a22f7683a8541292e1eed3c68110cd7e4b39be'
                and d.verified is true
        ), '0'),
        'contributionCount',
        coalesce((
            select pg_catalog.count(*)::text
            from public.recovery_fund_donations as d
            where d.intent_id is not null
                and d.chain_id = 143
                and d.token_contract = '0x350035555e10d9afaf1566aaebfced5ba6c27777'
                and d.recipient = '0x48a22f7683a8541292e1eed3c68110cd7e4b39be'
                and d.verified is true
        ), '0'),
        'recentContributions',
        coalesce((
            select pg_catalog.jsonb_agg(
                pg_catalog.jsonb_build_object(
                    'wallet', recent.sender,
                    'amountRaw', recent.amount_raw,
                    'usdAmountCents', recent.usd_amount_cents,
                    'timestamp', recent.block_timestamp,
                    'transactionHash', recent.tx_hash
                )
                order by recent.block_number desc, recent.log_index desc
            )
            from (
                select
                    d.sender,
                    d.amount_raw,
                    d.usd_amount_cents,
                    d.block_timestamp,
                    d.tx_hash,
                    d.block_number,
                    d.log_index
                from public.recovery_fund_donations as d
                where d.intent_id is not null
                    and d.chain_id = 143
                    and d.token_contract = '0x350035555e10d9afaf1566aaebfced5ba6c27777'
                    and d.recipient = '0x48a22f7683a8541292e1eed3c68110cd7e4b39be'
                    and d.verified is true
                order by d.block_number desc, d.log_index desc
                limit 10
            ) as recent
        ), '[]'::pg_catalog.jsonb)
    );
$function$;

revoke all on function public.recovery_fund_public_summary()
    from public, anon, authenticated, service_role;
grant execute on function public.recovery_fund_public_summary()
    to service_role;

commit;
