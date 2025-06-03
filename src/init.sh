#!/bin/bash

# -------- AUTH --------
mkdir -p auth/dto
touch auth/auth.controller.ts
touch auth/auth.module.ts
touch auth/auth.service.ts
touch auth/jwt-auth.guard.ts
touch auth/jwt.strategy.ts
touch auth/dto/login.dto.ts
touch auth/dto/login-response.dto.ts

# -------- COMMENT --------
mkdir -p comment/dto
touch comment/comment.controller.ts
touch comment/comment.entity.ts
touch comment/comment.module.ts
touch comment/comment.service.ts
touch comment/dto/create-comment.dto.ts
touch comment/dto/comment-author.dto.ts
touch comment/dto/response-comment.dto.ts

# -------- NOTIFICATION --------
mkdir -p notification/dto
touch notification/notification.controller.ts
touch notification/notification.entity.ts
touch notification/notification.interceptor.ts
touch notification/notification.module.ts
touch notification/notification.service.ts
touch notification/dto/notification-task.dto.ts
touch notification/dto/response-notification.dto.ts

# -------- TASK --------
mkdir -p task/dto
touch task/task.controller.ts
touch task/task.entity.ts
touch task/task.module.ts
touch task/task.service.ts
touch task/dto/assigned-to.dto.ts
touch task/dto/create-task.dto.ts
touch task/dto/response-task.dto.ts
touch task/dto/update-task.dto.ts

# -------- USER --------
mkdir -p user/dto
touch user/user.controller.ts
touch user/user.entity.ts
touch user/user.module.ts
touch user/user.service.ts
touch user/dto/create-user.dto.ts
touch user/dto/response-user.dto.ts

echo "Dosya ve klasör yapısı tamamlandı."
