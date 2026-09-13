# 佳贝艾特会员诊断驾驶舱 - 前端展示
# 支持 ARM64 和 AMD64 架构

FROM --platform=$BUILDPLATFORM nginx:alpine

# 复制静态文件
COPY index.html /usr/share/nginx/html/
COPY css /usr/share/nginx/html/css/
COPY js /usr/share/nginx/html/js/

# 配置 nginx
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    gzip on; \
    gzip_types text/plain text/css application/json application/javascript text/xml; \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
