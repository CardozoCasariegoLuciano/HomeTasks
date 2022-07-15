import React from "react"
import {Link, useLocation} from "wouter"
import "./login.scss";

const Login = () =>{

  const [location,  setLocation] = useLocation()

  const login = () => {
    setLocation("/")
  }

return( 
  <div className="Login">

    <form onSubmit={login}>
      <h2>Login</h2>

      <label htmlFor="email">Email</label>
      <input type="text" id="email" placeholder="ejemplo@gmail.com"/>

      <label htmlFor="password">Contraseña</label>
      <input type="password" id="password" placeholder="******"/>

      <div className="action_section">
        <button type="submit">Entrar </button>
        <label htmlFor="remember">Recuerdame</label>
        <input type="checkbox" id="remember"/>
      </div>

        <Link href="/register" className="link">
          <a href="##">¿Aun no tenes una cuenta?</a>
        </Link>

    </form>

  </div>
 )
}

export default Login
