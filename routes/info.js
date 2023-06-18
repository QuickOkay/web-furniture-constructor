let express = require('express');
let router = express.Router();

/* GET info page */
router.get('/', function(req, res, next) {
  res.send('Develop by Alex Orlov<br>E-Mail: <i>mister.qweeze@gmail.com</i> or <i>alexorlov.developer@gmail.com</i><br>' +
      'Until the summer of 24, I serve in the army.');
});

module.exports = router;
