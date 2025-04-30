"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Navbar = () => {
	const pathname = usePathname();

	return (
		<nav className="bg-white shadow-sm">
			<div className="max-w-6xl mx-auto px-4">
				<div className="flex justify-between items-center py-3">
					<div className="flex space-x-4">
						<Link
							href="/"
							className="flex items-center space-x-2 text-xl font-bold text-blue-600"
						>
							Rhemapp
						</Link>
					</div>
					<div className="hidden sm:flex sm:space-x-4">
						<NavLink href="/" pathname={pathname}>
							Inicio
						</NavLink>
						<NavLink href="/random" pathname={pathname}>
							Versículo Aleatorio
						</NavLink>
						<NavLink href="/daily" pathname={pathname}>
							Lectura del Día
						</NavLink>
					</div>

					<div className="sm:hidden">
						{/* Menú móvil simplificado */}
						<div className="flex space-x-2">
							<Link
								href="/"
								className={`px-3 py-1 text-sm rounded-md ${
									pathname === "/"
										? "bg-blue-100 text-blue-700"
										: "text-gray-600"
								}`}
							>
								Inicio
							</Link>
							<Link
								href="/random"
								className={`px-3 py-1 text-sm rounded-md ${
									pathname === "/random"
										? "bg-blue-100 text-blue-700"
										: "text-gray-600"
								}`}
							>
								Aleatorio
							</Link>
							<Link
								href="/daily"
								className={`px-3 py-1 text-sm rounded-md ${
									pathname === "/daily"
										? "bg-blue-100 text-blue-700"
										: "text-gray-600"
								}`}
							>
								Diario
							</Link>
						</div>
					</div>
				</div>
			</div>
		</nav>
	);
};

const NavLink = ({ href, pathname, children }) => {
	const isActive = pathname === href;

	return (
		<Link
			href={href}
			className={`px-3 py-2 rounded-md text-sm font-medium ${
				isActive
					? "bg-blue-100 text-blue-700"
					: "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
			}`}
		>
			{children}
		</Link>
	);
};

export default Navbar;
