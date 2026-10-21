begin;

create table public.recovery_fund_donations (
    chain_id integer not null check (chain_id = 143),
    tx_hash text not null
        check (tx_hash ~ '^0x[0-9a-f]{64}$'),
    log_index integer not null check (log_index >= 0),
    token_contract text not null
        check (token_contract = '0x350035555e10d9afaf1566aaebfced5ba6c27777'),
    recipient text not null
        check (recipient = '0x48a22f7683a8541292e1eed3c68110cd7e4b39be'),
    sender text not null
        check (sender ~ '^0x[0-9a-f]{40}$'),
    amount_raw text not null
        check (
            amount_raw ~ '^[0-9]{1,78}$'
            and amount_raw::numeric > 0
        ),
    block_number bigint not null check (block_number >= 37998426),
    block_hash text not null
        check (block_hash ~ '^0x[0-9a-f]{64}$'),
    block_timestamp timestamptz not null,
    verified boolean not null default true check (verified is true),
    verified_at timestamptz not null,
    constraint recovery_fund_donations_chain_tx_log_key
        unique (chain_id, tx_hash, log_index)
);

create index recovery_fund_donations_recent_idx
    on public.recovery_fund_donations (block_number desc, log_index desc);

create table public.recovery_fund_scan_state (
    id boolean primary key default true check (id is true),
    next_block bigint not null default 37998426
        check (next_block >= 37998426),
    updated_at timestamptz not null default now()
);

insert into public.recovery_fund_scan_state (id, next_block)
values (true, 37998426)
on conflict (id) do nothing;

alter table public.recovery_fund_donations enable row level security;
alter table public.recovery_fund_scan_state enable row level security;

revoke all on table public.recovery_fund_donations
    from public, anon, authenticated, service_role;
revoke all on table public.recovery_fund_scan_state
    from public, anon, authenticated, service_role;

grant select, insert on table public.recovery_fund_donations to service_role;
grant select, update on table public.recovery_fund_scan_state to service_role;

create function public.recovery_fund_public_summary()
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
            where d.chain_id = 143
                and d.token_contract = '0x350035555e10d9afaf1566aaebfced5ba6c27777'
                and d.recipient = '0x48a22f7683a8541292e1eed3c68110cd7e4b39be'
                and d.verified is true
        ), '0'),
        'contributionCount',
        coalesce((
            select pg_catalog.count(*)::text
            from public.recovery_fund_donations as d
            where d.chain_id = 143
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
                    'timestamp', recent.block_timestamp,
                    'transactionHash', recent.tx_hash
                )
                order by recent.block_number desc, recent.log_index desc
            )
            from (
                select
                    d.sender,
                    d.amount_raw,
                    d.block_timestamp,
                    d.tx_hash,
                    d.block_number,
                    d.log_index
                from public.recovery_fund_donations as d
                where d.chain_id = 143
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
