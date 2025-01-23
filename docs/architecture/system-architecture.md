# Create or update the file with proper Mermaid syntax
cat > docs/architecture/system-architecture.md << 'EOL'
# Streaming Analytics Platform - System Architecture

## Overview

This document details the system architecture of the Streaming Analytics Platform, a comprehensive solution for aggregating and analyzing music streaming data across multiple platforms.

## System Architecture Diagram

```mermaid
flowchart TB
    %% Presentation Layer
    subgraph Presentation["Presentation Layer"]
        direction TB
        subgraph UI["User Interface"]
            Dashboard["Dashboard\n(React)"]
            Analytics["Analytics View"]
            Reports["Reports View"]
        end
        subgraph Client["Client Layer"]
            StateManager["State Management"]
            APIClient["API Client"]
            ErrorHandler["Error Handling"]
        end
    end

    %% Service Layer
    subgraph Services["Service Layer"]
        direction TB
        APIG["API Gateway"]
        Cognito["AWS Cognito\nAuthentication"]
        RateLimit["Rate Limiting &\nThrottling"]
        Cache["Response Cache"]
    end

    %% Business Logic Layer
    subgraph Business["Business Logic Layer"]
        direction TB
        subgraph DataCollection["Data Collection Services"]
            SpotifyLambda["Spotify\nLambda"]
            AppleLambda["Apple Music\nLambda"]
            YTLambda["YouTube\nLambda"]
        end
        subgraph Processing["Data Processing"]
            ETL["AWS Glue\nETL Pipeline"]
            MLPipeline["ML Pipeline\n(SageMaker)"]
        end
    end

    %% Data Layer
    subgraph Data["Data Layer"]
        direction TB
        RawDB["Raw Data\n(DynamoDB)"]
        ProcessedDB["Processed Data\n(DynamoDB)"]
        MLModels["ML Models\n(S3)"]
    end

    %% External Services
    subgraph External["External Services"]
        direction TB
        SpotifyAPI["Spotify\nAPI"]
        AppleAPI["Apple Music\nAPI"]
        YTAPI["YouTube\nAPI"]
    end

    %% Connections
    Dashboard --> StateManager
    StateManager --> APIClient
    APIClient --> APIG
    APIG --> Cognito
    APIG --> RateLimit
    APIG --> Cache
    
    RateLimit --> SpotifyLambda & AppleLambda & YTLambda
    SpotifyLambda --> SpotifyAPI
    AppleLambda --> AppleAPI
    YTLambda --> YTAPI
    
    SpotifyLambda & AppleLambda & YTLambda --> RawDB
    RawDB --> ETL
    ETL --> ProcessedDB
    ProcessedDB --> MLPipeline
    MLPipeline --> MLModels
    
    %% Styling
    classDef presentation fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    classDef service fill:#f3e5f5,stroke:#6a1b9a,stroke-width:2px
    classDef business fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    classDef data fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef external fill:#fafafa,stroke:#424242,stroke-width:2px
    
    class Dashboard,Analytics,Reports,StateManager,APIClient,ErrorHandler presentation
    class APIG,Cognito,RateLimit,Cache service
    class SpotifyLambda,AppleLambda,YTLambda,ETL,MLPipeline business
    class RawDB,ProcessedDB,MLModels data
    class SpotifyAPI,AppleAPI,YTAPI external
    