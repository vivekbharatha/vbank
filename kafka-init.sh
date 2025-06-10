#!/bin/bash

init_scripts() {
  sleep 10
  echo "Creating Kafka topics..."
  kafka-topics.sh --create --topic user.registered --partitions 10 --replication-factor 1 --if-not-exists --bootstrap-server localhost:9094;
  kafka-topics.sh --create --topic account.created --partitions 10 --replication-factor 1 --if-not-exists --bootstrap-server localhost:9094;
  kafka-topics.sh --create --topic account.deleted --partitions 10 --replication-factor 1 --if-not-exists --bootstrap-server localhost:9094;
  kafka-topics.sh --create --topic transaction.events --partitions 10 --replication-factor 1 --if-not-exists --bootstrap-server localhost:9094;
  kafka-topics.sh --list --bootstrap-server localhost:9094;
}

init_scripts &

