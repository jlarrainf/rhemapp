"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
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
							className="flex items-center space-x-2 text-xl font-bold text-[#314156]"
						>
							<Image
								src="/Rhemapp_isotype.svg"
								alt="Rhemapp Logo"
								width={32}
								height={32}
								className="w-8 h-8"
							/>
							<span>Rhemapp</span>
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
						<NavLink href="/rosario" pathname={pathname}>
							Misterios del Rosario
						</NavLink>
					</div>

					<div className="sm:hidden">
						{/* Menú móvil simplificado */}
						<div className="flex space-x-2">
							<Link
								href="/"
								className={`px-3 py-1 text-sm rounded-md ${
									pathname === "/"
										? "bg-[#b79b72]/20 text-[#314156]"
										: "text-gray-600"
								}`}
							>
								Inicio
							</Link>
							<Link
								href="/random"
								className={`px-3 py-1 text-sm rounded-md ${
									pathname === "/random"
										? "bg-[#b79b72]/20 text-[#314156]"
										: "text-gray-600"
								}`}
							>
								Aleatorio
							</Link>
							<Link
								href="/daily"
								className={`px-3 py-1 text-sm rounded-md ${
									pathname === "/daily"
										? "bg-[#b79b72]/20 text-[#314156]"
										: "text-gray-600"
								}`}
							>
								Diario
							</Link>
							<Link
								href="/rosario"
								className={`px-3 py-1 text-sm rounded-md ${
									pathname === "/rosario"
										? "bg-[#b79b72]/20 text-[#314156]"
										: "text-gray-600"
								}`}
							>
								Rosario
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
					? "bg-[#b79b72]/20 text-[#314156]"
					: "text-gray-600 hover:bg-gray-100 hover:text-[#314156]"
			}`}
		>
			{children}
		</Link>
	);
};

export default Navbar;
