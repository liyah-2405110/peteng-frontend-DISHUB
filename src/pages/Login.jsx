import { useState } from 'react'
import logoPeteng from '../assets/logo-peteng.png'
import '../css/Login.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = (event) => {
    event.preventDefault()

    console.log('Email:', email)
    console.log('Password:', password)
  }

  return (
    <div className="login-page">
      <div className="login-container">

        <img
          src={logoPeteng}
          alt="Logo PETENG Indramayu"
          className="login-logo"
        />

        <h1>SELAMAT DATANG</h1>

        <form onSubmit={handleLogin} className="login-form">

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <button type="submit">
            Login
          </button>

        </form>

      </div>
    </div>
  )
}

export default Login