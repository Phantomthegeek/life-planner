-- Quick SQL to add popular IT certifications
-- Copy this into Supabase SQL Editor and run

INSERT INTO certifications (slug, name, description, difficulty) VALUES
('comptia-a-plus', 'CompTIA A+', 'Entry-level IT certification covering hardware and software', 3),
('comptia-network-plus', 'CompTIA Network+', 'Networking fundamentals and technologies', 4),
('comptia-security-plus', 'CompTIA Security+', 'Cybersecurity fundamentals', 4),
('aws-certified-cloud-practitioner', 'AWS Certified Cloud Practitioner', 'AWS cloud fundamentals', 3),
('aws-certified-solutions-architect', 'AWS Certified Solutions Architect', 'AWS cloud architecture and design', 4),
('aws-certified-developer', 'AWS Certified Developer', 'AWS application development', 4),
('microsoft-azure-fundamentals', 'Microsoft Azure Fundamentals', 'Azure cloud basics', 3),
('microsoft-azure-administrator', 'Microsoft Azure Administrator', 'Azure administration', 4),
('cisco-ccna', 'Cisco CCNA', 'Cisco Certified Network Associate', 4),
('google-cloud-associate', 'Google Cloud Associate Cloud Engineer', 'GCP fundamentals', 3),
('kubernetes-ckad', 'Kubernetes Certified Application Developer', 'Kubernetes application development', 4),
('kubernetes-cka', 'Kubernetes Certified Administrator', 'Kubernetes administration', 4)
ON CONFLICT (slug) DO NOTHING;  -- Prevents duplicates

