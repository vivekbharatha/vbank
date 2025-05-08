#!/bin/bash


# Configuration

DOCKER_CONTAINER="kafka" # Change this to your Kafka container name
#KAFKA_PATH="/opt/bitnami/kafka/bin" # Change this to your Kafka path
KAFKA_PATH="/opt/kafka" # Change this to your Kafka path
# TOPIC_FILE="topic-list.txt" # Change this to your topic file name
BOOTSTRAP_SERVER="localhost:9094" # Change this to your bootstrap server
REPLICATION_FACTOR=1 # Change this to your desired replication factor
PARTITIONS=10 # Change this to your desired number of partitions

# LIST OF TOPICS
TOPICS=(
    "user.registered"
    "account.created"
    "account.deleted"
)

echo "Connecting to Kafka container...:  $DOCKER_CONTAINER"

# Function to create a topic if it doesn't exist
create_topic_if_not_exists(){
    local topic=$1
    #local partitions=$2
    #local replication_factor=$3

    echo "Checking if topic $topic exists..."

    # Execute the command inside the docker container to check if the topic exists
    if ! docker exec -it $DOCKER_CONTAINER kafka-topics.sh \
        --bootstrap-server $BOOTSTRAP_SERVER \
        --list | grep -q "^$topic$"; then

        echo "Creating Topic: $topic"

    # Create Topic
        docker exec -it $DOCKER_CONTAINER kafka-topics.sh \
            --bootstrap-server $BOOTSTRAP_SERVER \
            --create \
            --topic $topic \
            --partitions $PARTITIONS \
            --replication-factor $REPLICATION_FACTOR

        echo "Topic $topic created successfully."
    else
        echo "Topic $topic already exists."
    fi

    
}

# Create each topic if it doesn't exist
for topic in "${TOPICS[@]}"; do
    # Create the topic
    create_topic_if_not_exists $topic
done

echo "All topics have been verified/checked."

echo "-------------------------------------------"
echo "List all topics in kafka"
docker exec -it $DOCKER_CONTAINER kafka-topics.sh --bootstrap-server $BOOTSTRAP_SERVER --list
echo "-------------------------------------------"
