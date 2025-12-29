#!/bin/bash

# Network Proxy Environment Variables for API Testing
export HTTP_PROXY="http://127.0.0.1:3128"
export HTTPS_PROXY="http://127.0.0.1:3128"
export http_proxy="http://127.0.0.1:3128"
export https_proxy="http://127.0.0.1:3128"
export NO_PROXY="localhost,127.0.0.1,.local,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16"
export no_proxy="localhost,127.0.0.1,.local,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16"

# SOCKS5 proxy for specific services
export SOCKS5_PROXY="socks5://127.0.0.1:1080"
export socks5_proxy="socks5://127.0.0.1:1080"

# Additional proxy settings for development
export REQUESTS_CA_BUNDLE=""
export SSL_CERT_FILE=""
export NODE_TLS_REJECT_UNAUTHORIZED="0"

echo "Proxy environment variables set"
