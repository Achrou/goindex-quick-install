// server.js
// where your node app starts

// we've started you off with Express (https://expressjs.com/)
// but feel free to use whatever libraries or frameworks you'd like through `package.json`.
const express = require("express");
const bodyParser = require("body-parser");
const xf = require("xfetch-js");
const app = express();

app.use(bodyParser.json());

// make all the files in 'public' available
// https://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// https://expressjs.com/en/starter/basic-routing.html
app.get("/", (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
});

app.get("/zh", (req, res) => {
  res.sendFile(__dirname + "/views/zh.html");
});

function replace(t, a, b) {
  const reg = new RegExp(String.raw`(\s${a}: \").*?(\")`);
  return t.replace(reg, "$1" + b + "$2");
}

function replaceAll(item, p1) {
  for (const [k, v] of Object.entries(item)) {
    if (k === "roots") {
      let roots = v.map((root) => {
        return {
          ...root,
          protect_file_link: false,
        };
      });
      p1 = p1.replace(
        /roots: \[([\s\S]*)\]/,
        '"roots": ' + JSON.stringify(roots, "", "\t")
      );
      continue;
    }
    if (v === true) {
      p1 = p1.replace(`${k}: false`, `${k}: true`);
    } else if (v === false) {
      p1 = p1.replace(`${k}: true`, `${k}: false`);
    } else if (v instanceof Object) {
      p1 = replaceAll(v, p1);
    } else {
      p1 = replace(p1, k, v);
    }
  }
  return p1;
}

app.post("/getCode", async (req, res) => {
  const p = req.body;
  const r = await xf
    .post("https://www.googleapis.com/oauth2/v4/token", {
      urlencoded: {
        code: p.indexConfig.authCode,
        client_id: "202264815644.apps.googleusercontent.com",
        client_secret: "X4Z3ca8xfWDb1Voo-F9a7ZxJ",
        redirect_uri: "urn:ietf:wg:oauth:2.0:oob",
        grant_type: "authorization_code",
      },
    })
    .json()
    .catch((e) => null);
  if (r === null) {
    return res.status(400).send({
      status: "fail",
      content: "",
      message:
        "Authorization Code is invalid. Perhaps it doesn's exists or it has been used for 1 time.",
    });
  }
  let code = await xf
    .get(
      `https://raw.githubusercontent.com/Aicirou/goindex-theme-acrou/v${p.options.version}/go2index/index.js`
    )
    .text();
  let options = code.match(
    /\/\/ =======Options START=======([\s\S]*)\/\/ =======Options END=======/
  )[0];
  code = code.replace(options, "");
  options = replace(options, "refresh_token", r.refresh_token);
  options = options.replace(/var themeOptions = \{([\s\S]*)\}/, (p1) => {
    return replaceAll(p.options, p1);
  });
  options = options.replace(/var authConfig = \{([\s\S]*)\}/, (p1) => {
    return replaceAll(p.indexConfig, p1);
  });
  res.set("Content-Type", "text/javascript; charset=utf-8");
  res.send({
    status: "success",
    content: options + code,
    message: "",
  });
});

// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
