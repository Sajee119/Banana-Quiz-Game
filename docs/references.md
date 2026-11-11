# References

The following sources and technologies informed the implementation and should
be acknowledged in the assignment submission.

## Project and external service

- Banana API documentation: <https://marcconrad.com/uob/banana/doc.php>
- Banana Quiz repository: <https://github.com/Sajee119/Banana-Quiz-Game>
- React documentation: <https://react.dev/>
- Vite documentation: <https://vite.dev/>
- Express documentation: <https://expressjs.com/>
- MongoDB documentation: <https://www.mongodb.com/docs/>

## Libraries and standards

- Axios: <https://axios-http.com/docs/intro>
- Mongoose: <https://mongoosejs.com/docs/>
- Passport: <https://www.passportjs.org/docs/>
- express-session: <https://github.com/expressjs/session>
- bcryptjs: <https://github.com/dcodeIO/bcrypt.js>
- Nodemailer: <https://nodemailer.com/>
- Joi validation: <https://joi.dev/api/>
- Helmet: <https://helmetjs.github.io/>
- Git documentation: <https://git-scm.com/doc>

The Banana API is the source of the calculation puzzles used by the game. The
server adapts its response into the internal `imageUrl` and `solution` shape,
validates the data, and withholds the solution from the browser until the
player has submitted an answer. The current implementation details and
endpoint contracts are documented in the project [README](../README.md).

## Attribution

The application-specific code is maintained in this repository. External
libraries are installed through the package manifests in `client/package.json`
and `server/package.json`; their licenses and transitive dependencies are
recorded in the corresponding lock files. Any additional code, images, or
guidance used for the assessment video should be named explicitly in the
submission and in nearby source comments where applicable.
