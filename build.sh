#!/bin/bash
set -e

echo "==> Installing Go 1.25.4..."
go install golang.org/dl/go1.25.4@latest

echo "==> Downloading Go 1.25.4 binary..."
$HOME/go/bin/go1.25.4 download

echo "==> Building application with Go 1.25.4..."
cd backend
$HOME/go/bin/go1.25.4 build -tags netgo -ldflags '-s -w' -o app cmd/api/main.go

echo "==> Build completed successfully!"
ls -lh app
