// index.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

// アップロード先のディレクトリを指定
const uploadDir = path.join(__dirname, 'uploads');
const dataFile = path.join(__dirname, 'data.json');

// アップロードディレクトリとデータファイルが存在しない場合は作成
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, JSON.stringify([]));
}

// multer の設定
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// ミドルウェアの設定
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// ホームページ（画像一覧表示）
app.get('/', (req, res) => {
  fs.readFile(dataFile, (err, data) => {
    if (err) {
      return res.status(500).send('Error reading data file');
    }
    const images = JSON.parse(data);
    let imageList = `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Uploaded Photos</title>
        <link rel="stylesheet" href="/styles/styles.css">
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Twi●ter</h1>
          </div>
          <ul>
    `;
    images.forEach(image => {
      imageList += `
        <li>
          <img src="/uploads/${image.filename}" width="200" />
          <p>Date: ${new Date(image.date).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}</p>
          <p>Comment: ${image.comment}</p>
          <form action="/delete/${image.filename}" method="POST">
            <button type="submit">Delete</button>
          </form>
        </li>
      `;
    });
    imageList += `
          </ul>
          <a href="/upload">upload</a>
          <div class="footer">
            <a href="/">Back to Photo List</a>
          </div>
        </div>
      </body>
      </html>
    `;
    res.send(imageList);
  });
});

// アップロードフォーム
app.get('/upload', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Upload Photo</title>
      <link rel="stylesheet" href="/styles/styles.css">
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Twi●ter</h1>
        </div>
        <form action="/upload" method="POST" enctype="multipart/form-data">
          <label for="photo">Photo:</label>
          <input type="file" id="photo" name="photo" required>
          <br />
          <label for="comment">Comment:</label>
          <input type="text" id="comment" name="comment" required>
          <br />
          <button type="submit">Upload</button>
        </form>
        <div class="footer">
          <a href="/">Back to Photo List</a>
        </div>
      </div>
    </body>
    </html>
  `);
});

// ファイルアップロード処理
app.post('/upload', upload.single('photo'), (req, res) => {
  const { comment } = req.body;
  const filename = req.file.filename;
  const date = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });

  fs.readFile(dataFile, (err, data) => {
    if (err) {
      return res.status(500).send('Error reading data file');
    }
    const images = JSON.parse(data);
    images.push({ filename, comment, date });
    
    fs.writeFile(dataFile, JSON.stringify(images), (err) => {
      if (err) {
        return res.status(500).send('Error saving data');
      }
      res.redirect('/');
    });
  });
});

// ファイル削除処理
app.post('/delete/:filename', (req, res) => {
  const filename = req.params.filename;

  fs.readFile(dataFile, (err, data) => {
    if (err) {
      return res.status(500).send('Error reading data file');
    }
    let images = JSON.parse(data);
    images = images.filter(image => image.filename !== filename);

    fs.writeFile(dataFile, JSON.stringify(images), (err) => {
      if (err) {
        return res.status(500).send('Error saving data');
      }
      fs.unlink(path.join(uploadDir, filename), (err) => {
        if (err) {
          return res.status(500).send('Error deleting file');
        }
        res.redirect('/');
      });
    });
  });
});

// アップロードされたファイルを提供するルート
app.use('/uploads', express.static(uploadDir));

// サーバーを指定ポートでリッスンする
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
