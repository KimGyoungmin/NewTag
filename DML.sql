INSERT INTO user (
    name, 
    nick, 
    password, 
    email, 
    phone, 
    birth, 
    provider, 
    provider_id, 
    role, 
    is_delete, 
    trust, 
    profile_img, 
    last_login_at, 
    created_at, 
    updated_at
) VALUES (
    'Admin',                                                          -- name
    'admin',                                                          -- nick
    '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG',  -- password (BCrypt로 암호화된 '1234')
    'admin@example.com',                                              -- email
    '010-1234-5678',                                                  -- phone (선택)
    '1990-01-01',                                                     -- birth (선택)
    'LOCAL',                                                          -- provider
    NULL,                                                             -- provider_id
    'ADMIN',                                                          -- role
    false,                                                            -- is_delete
    0.0,                                                              -- trust
    NULL,                                                             -- profile_img
    NULL,                                                             -- last_login_at
    NOW(),                                                            -- created_at
    NOW()                                                             -- updated_at
);

UPDATE user 
SET password = '$2a$10$UpFo5p7d8/dt8MhWWnK8oeRrF434c7iaB3KyO1YTTSr7glzxzHJIi' 
WHERE nick = 'admin';
select * from user;

SHOW CREATE TABLE user;