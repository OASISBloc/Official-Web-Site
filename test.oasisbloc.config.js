/*
테스트 서버에서 실행시 
$ ssh doublechain@172.16.1.13

노드 버전 필 확인
doublechain@core04:~/oasisbloc$ node -v
v8.12.0
doublechain@core04:~/oasisbloc$ npm -v
6.4.1

1. 경로 이동
cd /home/doublechain/oasisbloc

2. 서버 실행

// 개발모드로 실행
pm2 start test.oasisbloc.config.js

3. 서버 종료
pm2 stop test.oasisbloc.config.js

*/

module.exports = {
    apps: [
        {
            // pm2로 실행한 프로세스 목록에서 이 애플리케이션의 이름으로 지정될 문자열
            name: "url",
            // pm2로 실행될 파일 경로
            script: "./bin/www",
            // 개발환경시 적용될 설정 지정
            env: {
                "PORT": 3000,
                "NODE_ENV": "development"
            },
            // 배포환경시 적용될 설정 지정
            env_production: {
                "PORT": 3000,
                "NODE_ENV": "production"
            }
        }
    ]
};