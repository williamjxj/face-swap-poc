--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: FaceSource; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."FaceSource" (
    id text NOT NULL,
    filename text NOT NULL,
    width integer NOT NULL,
    height integer NOT NULL,
    file_path text NOT NULL,
    file_size bigint NOT NULL,
    mime_type text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_used_at timestamp(3) without time zone,
    usage_count integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    author_id text
);


ALTER TABLE public."FaceSource" OWNER TO postgres;

--
-- Name: GeneratedMedia; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."GeneratedMedia" (
    id text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    temp_path text,
    file_path text NOT NULL,
    file_size bigint NOT NULL,
    mime_type text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    download_count integer DEFAULT 0 NOT NULL,
    "isPaid" boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    author_id text,
    template_id text,
    face_source_id text
);


ALTER TABLE public."GeneratedMedia" OWNER TO postgres;

--
-- Name: Guideline; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Guideline" (
    id text NOT NULL,
    filename text NOT NULL,
    width integer NOT NULL,
    height integer NOT NULL,
    file_type text NOT NULL,
    file_size bigint NOT NULL,
    file_path text NOT NULL,
    is_allowed boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Guideline" OWNER TO postgres;

--
-- Name: Payment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Payment" (
    id text NOT NULL,
    amount numeric(65,30) NOT NULL,
    currency text NOT NULL,
    status text NOT NULL,
    type text NOT NULL,
    "txHash" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "userId" text NOT NULL,
    "generatedMediaId" text NOT NULL
);


ALTER TABLE public."Payment" OWNER TO postgres;

--
-- Name: TargetTemplate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TargetTemplate" (
    id text NOT NULL,
    filename text NOT NULL,
    type text NOT NULL,
    file_path text NOT NULL,
    thumbnail_path text,
    file_size bigint NOT NULL,
    duration integer,
    mime_type text,
    usage_count integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_used_at timestamp(3) without time zone,
    is_active boolean DEFAULT true NOT NULL,
    author_id text
);


ALTER TABLE public."TargetTemplate" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    account text NOT NULL,
    name text,
    password_hash text,
    last_login timestamp(3) without time zone,
    last_logout timestamp(3) without time zone
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Data for Name: FaceSource; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."FaceSource" (id, filename, width, height, file_path, file_size, mime_type, created_at, last_used_at, usage_count, is_active, author_id) FROM stdin;
ebc3b796-8093-47c9-adaf-5250214f21c0	1748312978896_image.png	800	1024	/sources/1748312978896_image.png	852054	image/png	2025-05-27 02:29:38.904	\N	0	f	38984598-b6ee-482b-b9da-7e74966f1fe5
a326e16e-3acc-4347-83d2-ef71b4640a87	1748314438931_image.png	800	1024	/sources/1748314438931_image.png	852054	image/png	2025-05-27 02:53:58.936	\N	0	f	38984598-b6ee-482b-b9da-7e74966f1fe5
c61cbd19-fc37-4427-8eff-cda34ddd06ae	1748315092501_image.png	800	1024	/sources/1748315092501_image.png	852054	image/png	2025-05-27 03:04:52.508	\N	0	f	38984598-b6ee-482b-b9da-7e74966f1fe5
62fb2687-7bd2-4938-9a3e-b77b88cf01d8	1748315755125_image.png	800	1024	/sources/1748315755125_image.png	852054	image/png	2025-05-27 03:15:55.131	\N	0	t	8e7ba467-4b2a-4ffa-90c8-7af5271b121f
\.


--
-- Data for Name: GeneratedMedia; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."GeneratedMedia" (id, name, type, temp_path, file_path, file_size, mime_type, created_at, download_count, "isPaid", is_active, author_id, template_id, face_source_id) FROM stdin;
a1a05229-c22f-495b-b83c-8ebd2ddf4bc1	1.mp4	video	\N	/outputs/1.mp4	7850262	video/mp4	2025-05-25 03:01:30.264	0	f	t	\N	\N	\N
18a31c8f-b665-43f3-993a-a14d8c221fba	10.mp4	video	\N	/outputs/10.mp4	25414614	video/mp4	2025-05-25 03:01:30.377	0	f	t	\N	\N	\N
dab2e330-45e9-4464-b7e3-b250b5e35802	2.mp4	video	\N	/outputs/2.mp4	17567685	video/mp4	2025-05-25 03:01:30.481	0	f	t	\N	\N	\N
f289700a-3ee9-4630-9f1a-038a04e150ce	3.mp4	video	\N	/outputs/3.mp4	7857755	video/mp4	2025-05-25 03:01:30.589	0	f	t	\N	\N	\N
90faf1a3-fa87-40d5-ac22-a7e24ec1cf2f	4.mp4	video	\N	/outputs/4.mp4	6397599	video/mp4	2025-05-25 03:01:30.694	0	f	t	\N	\N	\N
b6898bc3-d932-4b5e-9da5-6a943f7fe296	5.mp4	video	\N	/outputs/5.mp4	26490684	video/mp4	2025-05-25 03:01:30.805	0	f	t	\N	\N	\N
4ec3fce3-9345-4ff8-bf2f-eb40fc99d35a	6.mp4	video	\N	/outputs/6.mp4	17567017	video/mp4	2025-05-25 03:01:30.911	0	f	t	\N	\N	\N
e856c398-6860-4adf-8edd-d39f4d820df6	7.mp4	video	\N	/outputs/7.mp4	17574343	video/mp4	2025-05-25 03:01:31.016	0	f	t	\N	\N	\N
fe4a625d-e108-423d-8f46-4dd758f8767c	8.mp4	video	\N	/outputs/8.mp4	26513247	video/mp4	2025-05-25 03:01:31.124	0	f	t	\N	\N	\N
41b61c9b-d632-4dd9-a36c-618bc1a3f212	9.mp4	video	\N	/outputs/9.mp4	7839762	video/mp4	2025-05-25 03:01:31.23	0	f	t	\N	\N	\N
990f21d1-036e-4b66-aae8-e3b29e35274d	margot_1.mp4	video	\N	/outputs/margot_1.mp4	7850781	video/mp4	2025-05-25 03:01:31.334	0	f	t	\N	\N	\N
48c20f40-6121-4779-ad2a-b753e2784af6	margot_3.mp4	video	\N	/outputs/margot_3.mp4	26578709	video/mp4	2025-05-25 03:01:31.552	0	f	t	\N	\N	\N
67ed1ecc-b886-41af-95b1-d0dd0860f860	margot_2.mp4	video	\N	/outputs/margot_2.mp4	6410560	video/mp4	2025-05-25 03:01:31.442	0	t	t	\N	\N	\N
\.


--
-- Data for Name: Guideline; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Guideline" (id, filename, width, height, file_type, file_size, file_path, is_allowed, created_at, updated_at) FROM stdin;
8ce6cafa-2315-450f-91b7-26b02c881675	f1.png	140	140	image/png	35421	/guidelines/f1.png	f	2025-05-25 03:01:21.157	2025-05-25 03:01:21.157
b85dc9b6-5be8-49d7-832e-e0de12e6c081	f2.png	140	140	image/png	37444	/guidelines/f2.png	f	2025-05-25 03:01:21.237	2025-05-25 03:01:21.237
e04c0d3d-a889-4ef6-9f84-b9e830824882	f3.png	140	140	image/png	25323	/guidelines/f3.png	f	2025-05-25 03:01:21.316	2025-05-25 03:01:21.316
ffad3cfd-4535-4833-9b43-81085a1a0f0a	f4.png	140	140	image/png	20241	/guidelines/f4.png	f	2025-05-25 03:01:21.392	2025-05-25 03:01:21.392
4b03f7b1-21d8-4fe6-81fd-d4e94f614236	s1.png	140	140	image/png	30969	/guidelines/s1.png	t	2025-05-25 03:01:21.467	2025-05-25 03:01:21.467
ca9ed4de-7385-4a13-8353-5b15a4e6698c	s2.png	140	140	image/png	34414	/guidelines/s2.png	t	2025-05-25 03:01:21.54	2025-05-25 03:01:21.54
0aae146f-3e71-454f-aec5-10588746a647	s3.png	140	140	image/png	33424	/guidelines/s3.png	t	2025-05-25 03:01:21.617	2025-05-25 03:01:21.617
e3bac802-691a-4bf1-9d1f-c7a969b2d4dd	s4.png	140	140	image/png	32757	/guidelines/s4.png	t	2025-05-25 03:01:21.692	2025-05-25 03:01:21.692
\.


--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Payment" (id, amount, currency, status, type, "txHash", "createdAt", "userId", "generatedMediaId") FROM stdin;
\.


--
-- Data for Name: TargetTemplate; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TargetTemplate" (id, filename, type, file_path, thumbnail_path, file_size, duration, mime_type, usage_count, created_at, last_used_at, is_active, author_id) FROM stdin;
c2f32406-796d-44a9-a62d-56f094824af1	video.mp4	video	/videos/video.mp4	/thumbnails/video_thumbnail.webp	403621	5	video/mp4	0	2025-05-27 03:15:48.266	\N	t	8e7ba467-4b2a-4ffa-90c8-7af5271b121f
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, account, name, password_hash, last_login, last_logout) FROM stdin;
38984598-b6ee-482b-b9da-7e74966f1fe5	jxjwilliam@2925.com	\N	\N	2025-05-27 03:15:04.08	\N
8e7ba467-4b2a-4ffa-90c8-7af5271b121f	williamjxj@gmail.com	william jiang	\N	2025-05-27 03:16:28.212	\N
62981049-aa84-46db-997f-f7789d28d5f6	jxjwilliam1@2925.com	William Jiang	$2b$10$34aW45OCjvUzn9qTW2GzUeILsooYaMXhLVu964xurxmy/yHJsn3.6	2025-05-28 06:54:53.036	\N
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
\.


--
-- Name: FaceSource FaceSource_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FaceSource"
    ADD CONSTRAINT "FaceSource_pkey" PRIMARY KEY (id);


--
-- Name: GeneratedMedia GeneratedMedia_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GeneratedMedia"
    ADD CONSTRAINT "GeneratedMedia_pkey" PRIMARY KEY (id);


--
-- Name: Guideline Guideline_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Guideline"
    ADD CONSTRAINT "Guideline_pkey" PRIMARY KEY (id);


--
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- Name: TargetTemplate TargetTemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TargetTemplate"
    ADD CONSTRAINT "TargetTemplate_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: User_account_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_account_key" ON public."User" USING btree (account);


--
-- Name: FaceSource FaceSource_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FaceSource"
    ADD CONSTRAINT "FaceSource_author_id_fkey" FOREIGN KEY (author_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: GeneratedMedia GeneratedMedia_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GeneratedMedia"
    ADD CONSTRAINT "GeneratedMedia_author_id_fkey" FOREIGN KEY (author_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: GeneratedMedia GeneratedMedia_face_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GeneratedMedia"
    ADD CONSTRAINT "GeneratedMedia_face_source_id_fkey" FOREIGN KEY (face_source_id) REFERENCES public."FaceSource"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: GeneratedMedia GeneratedMedia_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GeneratedMedia"
    ADD CONSTRAINT "GeneratedMedia_template_id_fkey" FOREIGN KEY (template_id) REFERENCES public."TargetTemplate"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Payment Payment_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TargetTemplate TargetTemplate_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TargetTemplate"
    ADD CONSTRAINT "TargetTemplate_author_id_fkey" FOREIGN KEY (author_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

