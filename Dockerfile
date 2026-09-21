FROM ghcr.io/coollabsio/pocketbase:latest

COPY pb_hooks /app/pb_hooks

EXPOSE 8080

CMD ["serve", "--http=0.0.0.0:8080", "--dir=/app/pb_data", "--hooksDir=/app/pb_hooks"]
