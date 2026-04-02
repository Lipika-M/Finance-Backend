import { ApiError } from "../utils/ApiError.js";

const authorizeRoles = (...allowedRoles) => {
	return (req, _res, next) => {
		const userRole = req.user?.role;

		if (userRole && allowedRoles.includes(userRole)) {
			return next();
		}

		throw new ApiError(403, "Forbidden");
	};
};

export { authorizeRoles };
