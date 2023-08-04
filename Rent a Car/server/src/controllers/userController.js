const router = require('express').Router();
const userService = require('../services/userService')

router.post("/register",  async (req, res) => {
    const {username, password,email} = req.body;
    
    try {
        const hashedPass = await userService.passwordHash(password);
        const user = await userService.createUser(username, hashedPass, email);
       
        const tokenUser = await userService.createToken(user);
        
       const cookie =  res.cookie('rememberme', tokenUser, {httpOnly: true});
       console.log(cookie)
        res.status(200).json(cookie);
    } catch (error) {
        res.status(404).json(error)
    }
    
 
});

router.post("/login", async(req, res) => {
    const {email, password} = req.body;
    console.log(email, password)
try {
    const user = await userService.login(email, password);

    const tokenUser = await userService.createToken(user);

    res.cookie('user', tokenUser, {httpOnly: true});

    res.status(200).json(user);
    console.log('login', user)
} catch (error) {
    res.status(404).json(error)
}
});

router.get('/logout', (req, res) => {
    res.clearCookie('user');
    res.status(204);
});



module.exports = router;