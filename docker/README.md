# Docker (Database)

`docker-compose.db.yml` defines the local PostgreSQL database used by the backend.
It provisions a named volume (`postgres_data`) to persist the database files.

Start the database (and the volume) from the `docker` folder:

```bash
docker compose -f docker-compose.db.yml up -d
```

This will create (or reuse) the `postgres_data` volume and start the `vocabuai-postgres` container on port 5432.

Stop the container without removing the volume:

```bash
docker compose -f docker-compose.db.yml down
```

Remove the container and the volume (data loss):

```bash
docker compose -f docker-compose.db.yml down -v
```

`-v` removes named volumes created by the compose file (here: `postgres_data`). This deletes the PostgreSQL data directory, so the database is lost.

If you're using Docker Desktop on Windows, starting the Desktop app only starts the Docker engine. It does not start containers automatically unless you enable an auto-start option. You still need to run `docker compose ... up -d` (or start the compose app via the Docker Desktop UI).
