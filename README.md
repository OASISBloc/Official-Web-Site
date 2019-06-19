
# ICO Client
OASISBloc's Official and ICO web site

## Project setup
* nodejs - express
* ejs

$ npm install

## Run server

* Development Mode
$ export NODE_ENV=development

* Production Mode
$ export NODE_ENV=production

$ npm start

## Directory structure
```.
├── app.js
├── bin
│   └── www
├── config
│   └── awsconfig.json
│   └── countryCodes.json
│   └── dev.conf.js
│   └── prod.conf.js
├── controller
│   └── web
│       ├── common
│       │   └── commonController.js
│       ├── boardController.js
│       ├── joinController.js
│       ├── loginController.js
│       ├── mainController.js
│       └── mypageController.js
├── email
│   ├── resetPassword.html
│   └── welcome.html
├── models
│   ├── board.js
│   ├── boardModel.js
│   ├── joinModel.js
│   ├── loginModel.js
│   ├── mainModel.js
│   ├── mypageModel.js
│   └── user.js
├── package.json
├── public
│   ├── assets
│   ├── css
│   ├── images
│   ├── js
│   └── stylesheets
├── routes
│   ├── api
│   │   ├── user
│   │   │   ├── index.js
│   │   └── index.js
│   ├── board
│   ├── join
│   ├── login
│   ├── mypage
│   └── index.js
├── util
│   ├── authToken.js
│   ├── awsFileUpload.js
│   ├── crypto.js
│   ├── logger.js
│   ├── otpauth.js
│   ├── pagination.js
│   ├── passport.js
│   └── sendmail.js
└── views
    ├── board
    ├── join
    ├── layout
    ├── login
    └── mypage
```
