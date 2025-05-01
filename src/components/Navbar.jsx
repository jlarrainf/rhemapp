"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const Navbar = () => {
	const pathname = usePathname();
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [scrolled, setScrolled] = useState(false);

	// Efecto para detectar scroll y añadir sombra
	useEffect(() => {
		const handleScroll = () => {
			if (window.scrollY > 10) {
				setScrolled(true);
			} else {
				setScrolled(false);
			}
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	// Cerrar menú al hacer clic en un enlace
	const handleLinkClick = () => {
		setIsMenuOpen(false);
	};

	return (
		<nav
			className={`fixed top-0 left-0 right-0 z-50 bg-white transition-all duration-300 ${
				scrolled ? "shadow-md" : ""
			}`}
		>
			<div className="max-w-6xl mx-auto px-4">
				<div className="flex justify-between items-center py-3">
					{/* Logo */}
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

					{/* Menú de escritorio */}
					<div className="hidden md:flex md:space-x-4">
						<NavLink href="/" pathname={pathname} onClick={handleLinkClick}>
							Inicio
						</NavLink>
						<NavLink
							href="/random"
							pathname={pathname}
							onClick={handleLinkClick}
						>
							Versículo Aleatorio
						</NavLink>
						<NavLink
							href="/daily"
							pathname={pathname}
							onClick={handleLinkClick}
						>
							Lectura del Día
						</NavLink>
						<NavLink
							href="/rosario"
							pathname={pathname}
							onClick={handleLinkClick}
						>
							Misterios del Rosario
						</NavLink>
					</div>

					{/* Botón del menú móvil */}
					<div className="md:hidden">
						<button
							onClick={() => setIsMenuOpen(!isMenuOpen)}
							className="flex flex-col items-center justify-center p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b79b72]/50"
							aria-expanded={isMenuOpen}
							aria-label="Menú principal"
						>
							<span
								className={`block w-6 h-0.5 bg-[#314156] transition-all duration-300 ease-out ${
									isMenuOpen ? "rotate-45 translate-y-1.5" : ""
								}`}
							></span>
							<span
								className={`block w-6 h-0.5 bg-[#314156] mt-1.5 transition-all duration-300 ease-out ${
									isMenuOpen ? "opacity-0" : ""
								}`}
							></span>
							<span
								className={`block w-6 h-0.5 bg-[#314156] mt-1.5 transition-all duration-300 ease-out ${
									isMenuOpen ? "-rotate-45 -translate-y-1.5" : ""
								}`}
							></span>
						</button>
					</div>
				</div>
			</div>

			{/* Menú desplegable móvil */}
			<div
				className={`md:hidden absolute w-full bg-white transition-all duration-300 overflow-hidden shadow-lg ${
					isMenuOpen ? "max-h-screen py-3 opacity-100" : "max-h-0 opacity-0"
				}`}
			>
				<div className="flex flex-col space-y-2 px-4 pb-4">
					<MobileNavLink href="/" pathname={pathname} onClick={handleLinkClick}>
						Inicio
					</MobileNavLink>
					<MobileNavLink
						href="/random"
						pathname={pathname}
						onClick={handleLinkClick}
					>
						Versículo Aleatorio
					</MobileNavLink>
					<MobileNavLink
						href="/daily"
						pathname={pathname}
						onClick={handleLinkClick}
					>
						Lectura del Día
					</MobileNavLink>
					<MobileNavLink
						href="/rosario"
						pathname={pathname}
						onClick={handleLinkClick}
					>
						Misterios del Rosario
					</MobileNavLink>
				</div>
			</div>
		</nav>
	);
};

// Componente para enlaces de escritorio
const NavLink = ({ href, pathname, children, onClick }) => {
	const isActive = pathname === href;

	return (
		<Link
			href={href}
			onClick={onClick}
			className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
				isActive
					? "bg-[#b79b72]/20 text-[#314156]"
					: "text-gray-600 hover:bg-[#b79b72]/10 hover:text-[#314156]"
			}`}
		>
			{children}
		</Link>
	);
};

// Componente para enlaces móviles
const MobileNavLink = ({ href, pathname, children, onClick }) => {
	const isActive = pathname === href;

	return (
		<Link
			href={href}
			onClick={onClick}
			className={`block px-4 py-3 rounded-md text-base font-medium transition-all ${
				isActive
					? "bg-[#b79b72]/20 text-[#314156]"
					: "text-gray-600 hover:bg-[#b79b72]/10 hover:text-[#314156]"
			}`}
		>
			{children}
		</Link>
	);
};

export default Navbar;
