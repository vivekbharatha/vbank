#!/bin/bash

# Configuration
DOCKER_CONTAINER="kafka"  # Change this to your Kafka container name
KAFKA_PATH="/opt/kafka"   # Default Kafka path in most Docker images
BOOTSTRAP_SERVER="localhost:9094"  # Change if different
REPLICATION_FACTOR=1     # Change based on your cluster size
PARTITIONS=10            # Number of partitions for each topic

# List of topics to create
TOPICS=(
  "user.registered"
  "account.created"
  "account.deleted"
)

echo "Connecting to Kafka container: $DOCKER_CONTAINER"

# Function to create a topic if it doesn't exist
create_topic_if_not_exists() {
  local topic=$1
  
  echo "Checking if topic $topic exists..."
  
  # Execute command inside Docker container to check if topic exists
  if ! docker exec -it $DOCKER_CONTAINER kafka-topics.sh \
    --bootstrap-server $BOOTSTRAP_SERVER \
    --list | grep -q "^$topic$"; then
    
    echo "Creating topic: $topic"
    
    # Create the topic
    docker exec -it $DOCKER_CONTAINER kafka-topics.sh \
      --bootstrap-server $BOOTSTRAP_SERVER \
      --create \
      --topic $topic \
      --partitions $PARTITIONS \
      --replication-factor $REPLICATION_FACTOR
    
    echo "Topic $topic created successfully"
  else
    echo "Topic $topic already exists"
  fi
}

# Create each topic if it doesn't exist
for topic in "${TOPICS[@]}"; do
  create_topic_if_not_exists $topic
done

echo "All topics have been verified/created!"

echo "---------------------"
echo "Listing all topics in Kafka:"
docker exec -it $DOCKER_CONTAINER kafka-topics.sh --bootstrap-server $BOOTSTRAP_SERVER --list
echo "---------------------"