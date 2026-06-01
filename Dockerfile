ARG APP_VERSION=0.2.1
ARG APP_COMMIT_SHA=local
ARG APP_BUILD_TIME_UTC=
ARG APP_BRANCH=local

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG APP_VERSION
WORKDIR /src

COPY backend/VocabuAI.sln backend/
COPY backend/VocabuAI.Api/VocabuAI.Api.csproj backend/VocabuAI.Api/
COPY backend/VocabuAI.Application/VocabuAI.Application.csproj backend/VocabuAI.Application/
COPY backend/VocabuAI.Domain/VocabuAI.Domain.csproj backend/VocabuAI.Domain/
COPY backend/VocabuAI.Infrastructure/VocabuAI.Infrastructure.csproj backend/VocabuAI.Infrastructure/
RUN dotnet restore backend/VocabuAI.sln

COPY backend/ backend/
RUN dotnet publish backend/VocabuAI.Api/VocabuAI.Api.csproj -c Release -o /app/publish /p:UseAppHost=false /p:Version=$APP_VERSION

FROM mcr.microsoft.com/dotnet/aspnet:9.0
ARG APP_VERSION
ARG APP_COMMIT_SHA
ARG APP_BUILD_TIME_UTC
ARG APP_BRANCH
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 5080
ENV ASPNETCORE_URLS=http://0.0.0.0:5080
ENV APP_VERSION=$APP_VERSION
ENV APP_COMMIT_SHA=$APP_COMMIT_SHA
ENV APP_BUILD_TIME_UTC=$APP_BUILD_TIME_UTC
ENV APP_BRANCH=$APP_BRANCH
ENTRYPOINT ["dotnet", "VocabuAI.Api.dll"]
