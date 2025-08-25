-- root user (at id = 0)
INSERT INTO "user" 
    (id,  typ, username, cid, ctime, mid, mtime) VALUES 
    (0, 'Sys', 'root',  0,   now(), 0,   now());

-- User admin
INSERT INTO "user" 
    (username, typ,  cid, ctime, mid, mtime) VALUES 
    ('admin', 'Sys', 0,   now(), 0,   now());

-- User demo1
INSERT INTO "user" 
    (username, cid, ctime, mid, mtime) VALUES 
    ('demo1', 0, now(), 0,   now());

-- mock org
INSERT INTO "org"    
    (id, name, kind, cid, ctime, mid, mtime) VALUES
    (100, 'mock-admin', 'Personal', 1000, now(), 1000, now());

INSERT INTO "org"    
    (id, name, kind, cid, ctime, mid, mtime) VALUES
    (101, 'mock-01', 'Personal', 1000, now(), 1000, now());

