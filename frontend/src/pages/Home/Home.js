import React from "react"
import {Link} from "wouter"

const Home = () =>{

return( 
  <div className="Home">
    <h1>Home</h1>
    <Link href="/register">
      <a>Register</a>
    </Link>
    <Link href="/login">
      <a>Login</a>
    </Link>
  </div>
 )
}

export default Home
