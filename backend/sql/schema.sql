DROP TABLE IF EXISTS chat;

CREATE TABLE chat (
    id UUID UNIQUE PRIMARY KEY DEFAULT gen_random_uuid(),
    properties jsonb
);
