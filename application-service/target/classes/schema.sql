-- Création de la table job_application
CREATE TABLE IF NOT EXISTS job_application (
    id BIGSERIAL PRIMARY KEY,
    candidate_id BIGINT NOT NULL,
    job_id BIGINT NOT NULL,
    match_score DOUBLE PRECISION,
    status VARCHAR(20) DEFAULT 'PENDING',
    application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cv_content TEXT,
    cv_file_name VARCHAR(255),
    cover_letter TEXT,
    portfolio_url VARCHAR(500),
    linkedin_profile VARCHAR(500),
    additional_info TEXT,
    expected_salary VARCHAR(100),
    availability_date VARCHAR(50)
);

-- Création des index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_job_application_candidate_id ON job_application(candidate_id);
CREATE INDEX IF NOT EXISTS idx_job_application_job_id ON job_application(job_id);
CREATE INDEX IF NOT EXISTS idx_job_application_status ON job_application(status);
