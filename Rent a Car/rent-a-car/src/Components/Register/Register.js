import { useState, useEffect, useContext } from "react";
import * as userService from "../../services/userService";
import { UserContext } from "../../contexts/userContext";
const { Link, useNavigate } = require("react-router-dom");

export const Register = () => {
    const { loggedUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [error, setError] = useState({});
  const [user, setUser] = useState({
    username: "",
    email: "",
    password: "",
    repeatPass: "",
  });
  const [isSubmit, setSubmit] = useState(false);

  const onChangeHandler = (event) => {
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
    if (target === "username") {
      if (!user) {
        errors.username = "Username is required!";
      }

      setError({ ...error, username: errors.username });
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

    if (target === "repeatPass") {
      if (user === "") {
        errors.repeatPass = "Repeat-Password is required!";
      } else {
        setError({ ...error });
      }
      setError({ ...error, repeatPass: errors.repeatPass });
    }

    return errors;
  };

  useEffect(() => {
    console.log("in useEffect");
    if (
      Object.values(error).filter((x) => x !== undefined).length === 0 &&
      isSubmit
    ) {
      userService
        .register(user.username, user.email, user.password)
        .then((userData) => {
          if (userData.name === "error") {
            const keyWord = userData.constraint.split("_");
            setError({ mainError: `This ${keyWord[1]} already exists!`});
            setSubmit(false);
          } else {
            loggedUser(userData)
            setUser(userData);
            navigate("/");
          }
        })
        .catch((err) => {
          setError({ ...error, err });
        });
    }
  }, [isSubmit]);

  return (
    <div className="register-page">
      <img
        src="/images/register.jpg"
        alt="resgier-image"
        className="image-register-page"
      />
      <article className="register-fields">
        <div className="register-titles" />
        <h1 className="register-title">Welcome</h1>
        <h1 className="register-title-secound">back</h1>
        <p className="error" data-testid={"server-error"}>
          {error.mainError}
        </p>
        <div />

        <form action="" className="register-form" onSubmit={onSubmitHandler}>
          <input
            type="text"
            id="username"
            name="username"
            className="register-username"
            placeholder="Username"
            value={user.username}
            onChange={onChangeHandler}
            onBlur={(e) => validate(e.target.value, e.target.name)}
          />
          <br />
          <p className="error" data-testid={"RePassError"}>
            {error.username}
          </p>

          <br />
          <input
            type="text"
            id="email"
            name="email"
            className="register-email"
            placeholder="Email"
            value={user.email}
            onChange={onChangeHandler}
            onBlur={(e) => validate(e.target.value, e.target.name)}
          />
          <br />
          <p className="error" data-testid={"RePassError"}>
            {error.email}
          </p>

          <br />
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Password"
            className="register-password"
            value={user.password}
            onChange={onChangeHandler}
            onBlur={(e) => validate(e.target.value, e.target.name)}
          />
          <br />
          <p className="error" data-testid={"RePassError"}>
            {error.password}
          </p>

          <br />
          <input
            type="password"
            id="repeatPass"
            name="repeatPass"
            placeholder="Repeat-Password"
            className="register-re-password"
            value={user.repeatPass}
            onChange={onChangeHandler}
            onBlur={(e) => validate(e.target.value, e.target.name)}
          />
          <br />
          <p className="error" data-testid={"RePassError"}>
            {error.repeatPass}
          </p>
          <br />
          <input
            type="submit"
            value="register"
            className="register-submit-btn"
          />
        </form>
        <Link className="resiger-link" to="/login">
          Don't Have an Account? Sigh Up
        </Link>
      </article>
    </div>
  );
};
