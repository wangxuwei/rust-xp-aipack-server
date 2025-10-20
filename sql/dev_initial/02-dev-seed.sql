-- root user (at id = 0)
INSERT INTO "user" 
    (id, uuid, typ, username, cid, ctime, mid, mtime) VALUES 
    (0, '019a004f-04d1-7aa2-b3a5-ff0c7374bfd9', 'Sys', 'root',  0,   now(), 0,   now());

-- User admin
INSERT INTO "user" 
    (username, uuid, typ,  cid, ctime, mid, mtime) VALUES 
    ('admin', '019a004f-d6d4-72a3-b6c5-8fca644ee6b6', 'Sys', 0,   now(), 0,   now());

-- User demo1
INSERT INTO "user" 
    (username, uuid, cid, ctime, mid, mtime) VALUES 
    ('demo1', '019a0050-0a47-78a0-b62c-8549211e570b', 0, now(), 0,   now());

-- mock org
INSERT INTO "org"    
    (id, uuid, name, kind, cid, ctime, mid, mtime) VALUES
    (100, '019a0050-41cb-737d-b367-6ab31b820c87', 'mock-admin', 'Personal', 1000, now(), 1000, now());

INSERT INTO "org"    
    (id, uuid, name, kind, cid, ctime, mid, mtime) VALUES
    (101, '019a0050-68a5-7e16-b36b-1bfe38d55f65', 'mock-01', 'Personal', 1000, now(), 1000, now());

