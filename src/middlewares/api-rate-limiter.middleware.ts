import App from '../app';
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 60 minutes
	max: 1000, // Limit each IP to 1000 requests per `window` (here, per 15 minutes)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message:
    "Too many requests from this IP, please try again."
})

export default limiter;