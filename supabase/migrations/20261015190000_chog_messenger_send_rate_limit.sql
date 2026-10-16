begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create role chog_messenger_limiter nologin;
grant usage on schema private, public to chog_messenger_limiter;
grant create on schema public to chog_messenger_limiter;

create table private.messenger_rate_limits (
    client_digest text primary key
        check (client_digest ~ '^[0-9a-f]{64}$'),
    sent_at timestamptz[] not null
        check (pg_catalog.cardinality(sent_at) <= 5),
    last_seen timestamptz not null
);

create index messenger_rate_limits_last_seen_idx
    on private.messenger_rate_limits (last_seen);

alter table private.messenger_rate_limits enable row level security;
revoke all on table private.messenger_rate_limits
    from public, anon, authenticated, service_role;
grant select, insert, update, delete on table private.messenger_rate_limits
    to chog_messenger_limiter;

create policy chog_messenger_limiter_manage_state
    on private.messenger_rate_limits
    for all
    to chog_messenger_limiter
    using (true)
    with check (true);

revoke insert on table public.messages from anon, authenticated;
grant insert on table public.messages to chog_messenger_limiter;
create policy chog_messenger_limiter_insert_message
    on public.messages
    for insert
    to chog_messenger_limiter
    with check (true);

create function public.submit_messenger_message(
    p_client_digest text,
    p_display_name text,
    p_body text
)
returns table (
    accepted boolean,
    retry_after_seconds integer,
    message jsonb
)
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
    v_now timestamptz;
    v_recent timestamptz[];
    v_message_id uuid;
    v_retry_after integer;
begin
    if p_client_digest is null or p_client_digest !~ '^[0-9a-f]{64}$' then
        raise exception 'Invalid client digest' using errcode = '22023';
    end if;

    if p_display_name is null
        or pg_catalog.char_length(pg_catalog.btrim(p_display_name)) not between 1 and 24
        or p_display_name <> pg_catalog.btrim(p_display_name)
        or p_display_name ~ '^[[:space:]]|[[:space:]]$' then
        raise exception 'Invalid display name' using errcode = '22023';
    end if;

    if p_body is null
        or pg_catalog.char_length(pg_catalog.btrim(p_body)) not between 1 and 500
        or p_body <> pg_catalog.btrim(p_body)
        or p_body ~ '^[[:space:]]|[[:space:]]$' then
        raise exception 'Invalid message body' using errcode = '22023';
    end if;

    perform pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(p_client_digest, 0)
    );

    v_now := pg_catalog.clock_timestamp();

    delete from private.messenger_rate_limits
    where last_seen < v_now - interval '1 day';

    select coalesce(
        pg_catalog.array_agg(recent.sent_at order by recent.sent_at),
        array[]::pg_catalog.timestamptz[]
    )
    into v_recent
    from private.messenger_rate_limits as limits
    cross join lateral pg_catalog.unnest(limits.sent_at) as recent(sent_at)
    where limits.client_digest = p_client_digest
        and recent.sent_at > v_now - interval '1 minute';

    if pg_catalog.cardinality(v_recent) >= 5 then
        update private.messenger_rate_limits
        set last_seen = v_now
        where client_digest = p_client_digest;

        v_retry_after := greatest(
            1,
            ceil(extract(epoch from (v_recent[1] + interval '1 minute' - v_now)))::integer
        );
        return query select false, v_retry_after, null::pg_catalog.jsonb;
        return;
    end if;

    v_message_id := pg_catalog.gen_random_uuid();

    insert into public.messages (id, created_at, display_name, body)
    values (v_message_id, v_now, p_display_name, p_body);

    insert into private.messenger_rate_limits as existing (
        client_digest,
        sent_at,
        last_seen
    )
    values (
        p_client_digest,
        v_recent || v_now,
        v_now
    )
    on conflict (client_digest) do update
    set sent_at = excluded.sent_at,
        last_seen = excluded.last_seen;

    return query
    select
        true,
        0,
        pg_catalog.jsonb_build_object(
            'id', v_message_id,
            'created_at', v_now,
            'display_name', p_display_name,
            'body', p_body
        );
end;
$function$;

grant chog_messenger_limiter to postgres;

alter function public.submit_messenger_message(text, text, text)
    owner to chog_messenger_limiter;
revoke chog_messenger_limiter from postgres;
revoke create on schema public from chog_messenger_limiter;

revoke all on function public.submit_messenger_message(text, text, text)
    from public, anon, authenticated, service_role;
grant execute on function public.submit_messenger_message(text, text, text)
    to service_role;

commit;
