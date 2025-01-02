DROP TABLE IF EXISTS developers;

CREATE TABLE developers (
    id SERIAL PRIMARY KEY,
	  name VARCHAR(100) NOT NULL,
	  profile_image TEXT NOT NULL,
    about_me TEXT NOT NULL
);

DROP TABLE IF EXISTS businesses;

CREATE TABLE businesses (
    id SERIAL PRIMARY KEY,
  	name VARCHAR(100) NOT NULL,
	  company_logo TEXT NOT NULL,
  	industry VARCHAR(100) NOT NULL,
    description TEXT NOT NULL
);

DROP TABLE IF EXISTS business_projects;

CREATE TABLE business_projects (
    id SERIAL PRIMARY KEY,
    project_owner INT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    brief TEXT NOT NULL,
    desired_skill VARCHAR(100),
    deadline DATE,
    status VARCHAR NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'))
);

DROP TABLE IF EXISTS project_applications;

CREATE TABLE project_applications (
    id SERIAL PRIMARY KEY,
  	developer_id INT NOT NULL REFERENCES developers(id) on DELETE CASCADE,
    project_id INT NOT NULL REFERENCES business_projects(id) ON DELETE CASCADE,
    status VARCHAR NOT NULL CHECK (status IN ('pending', 'successful', 'unsuccessful'))
);

DROP TABLE IF EXISTS social_links;

CREATE TABLE social_links (
    id SERIAL PRIMARY KEY,
  	developer_id INT UNIQUE NOT NULL REFERENCES developers(id) on DELETE CASCADE,
  	linkedin TEXT,
  	github TEXT,
	  website TEXT,
	  other TEXT
		CONSTRAINT check_has_at_least_one_social_link CHECK (
        linkedin IS NOT NULL OR 
        github IS NOT NULL OR 
        website IS NOT NULL OR 
        other IS NOT NULL
    )
);

DROP TABLE IF EXISTS services;

CREATE TABLE services (
    id SERIAL PRIMARY KEY,
  	title VARCHAR(100) UNIQUE NOT NULL
);

DROP TABLE IF EXISTS developer_services;

CREATE TABLE developer_services (
    id SERIAL PRIMARY KEY,
  	developer_id INT NOT NULL REFERENCES developers(id) on DELETE CASCADE,
	  service_id INT NOT NULL REFERENCES services(id) on DELETE CASCADE
);

DROP TABLE IF EXISTS portfolio_projects;

CREATE TABLE portfolio_projects (
    id SERIAL PRIMARY KEY,
  	project_owner INT NOT NULL REFERENCES developers(id) on DELETE CASCADE,
  	image TEXT NOT NULL,
  	title VARCHAR(100) NOT NULL,
  	description TEXT NOT NULL,
  	services TEXT NOT NULL
);

DROP TABLE IF EXISTS testimonials;

CREATE TABLE testimonials (
    id SERIAL PRIMARY KEY,
  	developer_id INT NOT NULL REFERENCES developers(id) on DELETE CASCADE,
  	testimonial_owner INT NOT NULL REFERENCES businesses(id) on DELETE CASCADE,
  	rating INT NOT NULL,
  	feedback TEXT NOT NULL
 );