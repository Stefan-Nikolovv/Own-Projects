import { useState, useEffect, useContext } from "react";

import  * as userService from '../../services/userService';
import { UserContext } from "../../contexts/userContext";

const { Link, useNavigate } = require("react-router-dom");

export const Login = () => {
    const { loggedUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [error, setError] = useState({});
  const [user, setUser] = useState({
    email: "",
    password: "",
  });
  const [isSubmit, setSubmit] = useState(false);

    const onChangeLoginHandler = (event) =>{
        event.preventDefault();
        const target = event.target;
    setUser({
      ...user,
      [target.name]: target.value,
    });
    };

    const onSubmitHandler = (event) => {
        event.preventDefault();
        
        setSubmit(true);
    };

    const validate = (user, target) => {
        
        const errors = {};
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
        if (target === "email") {
            
          if (!user) {
            errors.email = "Email is required!";
          } else if (!regex.test(user)) {
            errors.email = "This is not a valid email format!";
          } else {
            setError({ ...error, login: errors.email });
          }
          setError({ ...error, email: errors.email });
        }
        if (target === "password") {
          if (user === "") {
            errors.password = "Password is required!";
          } else if (user.length < 4) {
            errors.password = "Password must be more than 4 characters";
          } else if (user.length > 10) {
            errors.password = "Password must be less than 10 characters";
          } else {
            setError({ ...error });
          }
          setError({ ...error, password: errors.password });
        }
    
        return errors;
      };

      useEffect(() => {
        if (
          Object.values(error).filter((x) => x !== undefined).length === 0 &&
          isSubmit
        ) {
          userService.login(user.email, user.password)
            .then((userData) => {
                if(userData.name === 'error'){
                    const keyWord = userData.constraint.split("_");
                    setError({ mainError: `This ${keyWord[1]} already exists!`});
                    setSubmit(false);
                }else{
                    loggedUser(userData);
                    setUser(userData)
                    navigate('/');
                }
                

            })
            .catch((err) => {
              setError({ ...error});
            });
        }
      }, [isSubmit]);



    return (
        <div className="login-page">
        <article className="login-fields">
            <div className="login-titles">
                <h1 className="login-title">
                    Welcome
                </h1>
                <h1 className="login-title-secound">
                    back
                </h1>
                <p className="error" data-testid={"server-error"}>
            {error.mainError}
          </p>
            </div>
            
            <form action="" className="login-form" onSubmit={onSubmitHandler}>
           
                <input type="email" 
                onChange={onChangeLoginHandler} 
                onBlur={(e) => validate(e.target.value, e.target.name)}
                 value={user.email} 
                 id="email" 
                 name="email" 
                 className="login-email"
                  placeholder="Email"/><br/><br/>
                  <p className="error" data-testid="emailError" >
            {error.email}
                </p>
                <input type="password" 
                onChange={onChangeLoginHandler}
                  id="password"
                   name="password"
                    placeholder="Password"
                     className="login-password"
                     value={user.password}
                    onBlur={(e) => validate(e.target.value, e.target.name)}
                     /><br/><br/>
                      <p className="error" data-testid="emailError" >
            {error.password}
                </p>
                <input type="submit"  value="Login" className="login-submit-btn"/>
              </form>
              <Link className="resiger-link" to='/register'>Don't Have an Account? Sigh Up</Link>
        </article>
        <img src="/images/login.jpg" alt="login-image" className="image-login-page"/>
    <div/>
  
    </div>
    
    );
};