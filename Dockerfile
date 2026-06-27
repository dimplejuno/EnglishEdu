# node:sqlite 내장 모듈을 위해 Node 24+ 사용
FROM node:24-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321
# 빌드 산출물과 프로덕션 의존성만 복사
COPY --from=build /app/dist ./dist
COPY package*.json ./
RUN npm ci --omit=dev
# SQLite 파일이 저장될 디렉터리 (볼륨으로 마운트 권장)
RUN mkdir -p /app/data
VOLUME ["/app/data"]
EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]
