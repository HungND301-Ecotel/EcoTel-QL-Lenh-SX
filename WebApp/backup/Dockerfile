FROM python:3.11-slim

# Install cron, MongoDB tools, and dependencies
# RUN apt-get update && \
#     apt-get install -y cron gnupg curl wget unzip tar && \
#     curl -fsSL https://pgp.mongodb.com/server-6.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-6.0.gpg && \
#     echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/debian buster/mongodb-org/6.0 main" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list && \
#     apt-get update && \
#     apt-get install -y mongodb-database-tools && \
#     pip install boto3

RUN apt-get update && \
    apt-get install -y cron curl wget unzip tar python3-pip && \
    wget https://fastdl.mongodb.org/tools/db/mongodb-database-tools-debian12-x86_64-100.9.4.tgz && \
    tar -xzf mongodb-database-tools-debian12-x86_64-100.9.4.tgz && \
    mv mongodb-database-tools-*/bin/* /usr/local/bin/ && \
    rm -rf mongodb-database-tools* && \
    pip install boto3

# Set working dir and copy scripts
WORKDIR /app

# Copy the source code folder to the container
COPY src ./src


# Setup cron job & permissions
COPY crontab /etc/cron.d/mongo-backup
RUN chmod 0644 /etc/cron.d/mongo-backup && \
    crontab /etc/cron.d/mongo-backup

# Copy entrypoint script and give execute permissions
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod a+x /app/entrypoint.sh

# Use entrypoint script to handle migrations & app startup
ENTRYPOINT ["/app/entrypoint.sh"]
