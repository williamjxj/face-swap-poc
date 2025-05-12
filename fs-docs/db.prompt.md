### 🥬 DB Type: TEXT vs. VARCHAR


## Core Tables

### templates
```sql
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type ENUM('video', 'image', 'gif', 'multi-face') NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    thumbnail_path VARCHAR(500),
    file_size BIGINT NOT NULL,
    duration INTEGER,
    mime_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    author_id UUID REFERENCES users(id),
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);
```

### face_sources
```sql
CREATE TABLE face_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    author_id UUID REFERENCES users(id),
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);
```

### generated_media
```sql
CREATE TABLE generated_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type ENUM('video', 'image') NOT NULL,
    temp_path VARCHAR(500),
    file_path VARCHAR(500) NOT NULL,
    thumbnail_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    author_id UUID REFERENCES users(id),
    is_purchased BOOLEAN DEFAULT false,
    play_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    template_id UUID REFERENCES templates(id),
    face_source_id UUID REFERENCES face_sources(id)
);
```

### users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE,
    last_logout TIMESTAMP WITH TIME ZONE
);
```

### guidelines
```sql
CREATE TABLE guidelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    thumbnail_path VARCHAR(500) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);
```

```sql
CREATE TABLE face_swaps (
    id SERIAL PRIMARY KEY,
    face_source_id INTEGER REFERENCES face_sources(id) ON DELETE SET NULL,
    template_id INTEGER REFERENCES templates(id) ON DELETE SET NULL,
    generated_media_id INTEGER REFERENCES generated_media(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Notes

- All tables include soft delete capability via `is_active`
- Use UUID for all IDs to ensure uniqueness across potential distributed systems
- Implement proper indexing based on query patterns
- Consider implementing event tracking table for detailed usage analytics
- Implement proper file path validation and sanitization
- Ensure proper backup strategy for both database and file storage
- Implement migration strategy for future cloud storage transition


### 🥒 

can you please create a javascript function video2thumbnail which has same implementation of @video2thumbnail.sh ?
when user upload a video, the function

### 🌶  

`npx prisma migrate deploy`

### 🌽 

### 🥕 create a shell script:

- insert data into TargetTemplate table, the data is the files collection from storage/template-thumbnails and storage/template-videos
- each media file should have a record.
- thumbnail_path: file in template-thumbnails
- file_path: file in template-videos
- file_size: video file_size
- duration: video duration in seconds
- 