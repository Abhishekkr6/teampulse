import { Request, Response } from "express";
import { UserModel } from "../models/user.model";

export const getMe = async (req: Request, res: Response) => {
	try {
		const userId = (req as any).userId || (req as any).user?.id || (req as any).user?._id;
		if (!userId) {
			return res.status(401).json({ success: false, error: { message: "Unauthorized" } });
		}

		const user = await UserModel.findById(userId).lean();
		if (!user) {
			return res.status(404).json({ success: false, error: { message: "User not found" } });
		}

		const data = {
			user: {
				_id: String(user._id),
				name: user.name || "",
				email: user.email || "",
				avatarUrl: user.avatarUrl || "",
				githubId: user.githubId,
				defaultOrgId: user.defaultOrgId ? String(user.defaultOrgId) : null,
				orgIds: Array.isArray(user.orgIds) ? user.orgIds.map((id: any) => String(id)) : [],
			},
		};

		return res.json({ success: true, data });
	} catch (err) {
		return res.status(500).json({ success: false, error: { message: "Failed to fetch user" } });
	}
};
