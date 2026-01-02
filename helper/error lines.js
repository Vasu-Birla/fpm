return res.render('superadmin/error500', { 
  output: `Internal Server: ${kilerrors(error)}` 
});



  res.cookie('kwe_msg', `Internal Server: ${kilerrors(error)}`);
            return res.redirect('/superadmin/profile');
OR 
return res.cookie('kwe_msg', `Internal Server: ${kilerrors(error)}`).redirect('/superadmin/login');




             const output = req.cookies.kwe_msg || '';