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
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


SET default_table_access_method = heap;

--
-- Name: FaceSource; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: GeneratedMedia; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: Guideline; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: Payment; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: TargetTemplate; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    account text NOT NULL,
    name text,
    password_hash text,
    last_login timestamp(3) without time zone,
    last_logout timestamp(3) without time zone
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: FaceSource FaceSource_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FaceSource"
    ADD CONSTRAINT "FaceSource_pkey" PRIMARY KEY (id);


--
-- Name: GeneratedMedia GeneratedMedia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GeneratedMedia"
    ADD CONSTRAINT "GeneratedMedia_pkey" PRIMARY KEY (id);


--
-- Name: Guideline Guideline_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Guideline"
    ADD CONSTRAINT "Guideline_pkey" PRIMARY KEY (id);


--
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- Name: TargetTemplate TargetTemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TargetTemplate"
    ADD CONSTRAINT "TargetTemplate_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: User_account_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_account_key" ON public."User" USING btree (account);


--
-- Name: FaceSource FaceSource_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FaceSource"
    ADD CONSTRAINT "FaceSource_author_id_fkey" FOREIGN KEY (author_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: GeneratedMedia GeneratedMedia_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GeneratedMedia"
    ADD CONSTRAINT "GeneratedMedia_author_id_fkey" FOREIGN KEY (author_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: GeneratedMedia GeneratedMedia_face_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GeneratedMedia"
    ADD CONSTRAINT "GeneratedMedia_face_source_id_fkey" FOREIGN KEY (face_source_id) REFERENCES public."FaceSource"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: GeneratedMedia GeneratedMedia_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GeneratedMedia"
    ADD CONSTRAINT "GeneratedMedia_template_id_fkey" FOREIGN KEY (template_id) REFERENCES public."TargetTemplate"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Payment Payment_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TargetTemplate TargetTemplate_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TargetTemplate"
    ADD CONSTRAINT "TargetTemplate_author_id_fkey" FOREIGN KEY (author_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

