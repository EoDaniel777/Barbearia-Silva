#!/bin/bash
set -e

# Download e instala Go 1.25.4 diretamente
GO_VERSION="1.25.4"
GO_TAR="go${GO_VERSION}.linux-amd64.tar.gz"
GO_INSTALL_DIR="/tmp/go${GO_VERSION}"

echo "==> Downloading Go ${GO_VERSION}..."
cd /tmp
curl -sSL "https://go.dev/dl/${GO_TAR}" -o "${GO_TAR}"

echo "==> Extracting Go ${GO_VERSION}..."
tar -xzf "${GO_TAR}"
mv go "${GO_INSTALL_DIR}"

echo "==> Go ${GO_VERSION} installed at ${GO_INSTALL_DIR}"
GO_BIN="${GO_INSTALL_DIR}/bin/go"
${GO_BIN} version

echo "==> Building application..."
cd "$OLDPWD/backend"
${GO_BIN} build -tags netgo -ldflags '-s -w' -o app cmd/api/main.go

echo "==> Build completed successfully!"
ls -lh app
