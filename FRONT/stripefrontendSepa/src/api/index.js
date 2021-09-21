import axios from 'axios';


export default axios.create({
  baseURL: 'https://localhost:4000/v1/',
  timeout: 10000,
  withCredentials: true,
});
