"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import AuthActions from "./AuthActions";
import ProfileMenu from "./ProfileMenu";
import ThemePreferenceControl from "./ThemePreferenceControl";

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

	useEffect(() => {
		setIsMenuOpen(false);
	}, [pathname]);

	// Cerrar menú al hacer clic en un enlace
	const handleLinkClick = () => {
		setIsMenuOpen(false);
	};

	return (
		<nav
			className={`fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 transition-all duration-300 ${
				scrolled ? "shadow-md dark:shadow-lg dark:shadow-black/20" : ""
			}`}
		>
			<div className="mx-auto max-w-6xl px-3 sm:px-4">
				<div className="flex min-h-14 items-center justify-between py-2">
					{/* Logo */}
					<div className="flex shrink-0">
						<Link
							href="/"
							className="flex items-center gap-2 text-xl font-bold text-[#314156] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79b72] dark:text-[#b79b72]"
							aria-label="Ir al inicio de Rhemapp"
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
					<div className="hidden items-center gap-1 md:flex lg:gap-2">
						<NavLink
							href="/random"
							pathname={pathname}
							onClick={handleLinkClick}
						>
							Versículos aleatorios
						</NavLink>
						<NavLink
							href="/daily"
							pathname={pathname}
							onClick={handleLinkClick}
						>
							Lectura del día
						</NavLink>
						<NavLink
							href="/rosario"
							pathname={pathname}
							onClick={handleLinkClick}
						>
							Misterios del Rosario
						</NavLink>
						<ProfileMenu />
					</div>

					{/* Botón del menú móvil y tema (versión móvil) */}
					<div className="md:hidden flex items-center">
						<button
							onClick={() => setIsMenuOpen(!isMenuOpen)}
							className="flex min-h-11 min-w-11 flex-col items-center justify-center rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#b79b72]/50"
							aria-expanded={isMenuOpen}
							aria-label="Menú principal"
						>
							<span
								className={`block w-6 h-0.5 bg-[#314156] dark:bg-gray-200 transition-all duration-300 ease-out ${
									isMenuOpen ? "rotate-45 translate-y-1.5" : ""
								}`}
							></span>
							<span
								className={`block w-6 h-0.5 bg-[#314156] dark:bg-gray-200 mt-1.5 transition-all duration-300 ease-out ${
									isMenuOpen ? "opacity-0" : ""
								}`}
							></span>
							<span
								className={`block w-6 h-0.5 bg-[#314156] dark:bg-gray-200 mt-1.5 transition-all duration-300 ease-out ${
									isMenuOpen ? "-rotate-45 -translate-y-1.5" : ""
								}`}
							></span>
						</button>
					</div>
				</div>
			</div>

			{/* Menú desplegable móvil */}
			<div
				className={`md:hidden absolute w-full bg-white dark:bg-gray-800 transition-all duration-300 overflow-hidden shadow-lg dark:shadow-black/30 ${
					isMenuOpen ? "max-h-screen py-3 opacity-100" : "max-h-0 opacity-0"
				}`}
			>
				<div className="flex flex-col gap-2 px-4 pb-4">
					<MobileNavLink
						href="/random"
						pathname={pathname}
						onClick={handleLinkClick}
					>
						Versículos aleatorios
					</MobileNavLink>
					<MobileNavLink
						href="/daily"
						pathname={pathname}
						onClick={handleLinkClick}
					>
						Lectura del día
					</MobileNavLink>
					<MobileNavLink
						href="/rosario"
						pathname={pathname}
						onClick={handleLinkClick}
					>
						Misterios del Rosario
					</MobileNavLink>
					<div className="mt-2 border-t border-gray-200 pt-3 dark:border-gray-700">
						<p className="px-4 pb-1 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
							Perfil y más
						</p>
						<MobileNavLink href="/biblioteca" pathname={pathname} onClick={handleLinkClick}>
							Mi biblioteca
						</MobileNavLink>
						<MobileNavLink href="/sugerencias" pathname={pathname} onClick={handleLinkClick}>
							Sugerencias
						</MobileNavLink>
						<MobileNavLink href="/perfil" pathname={pathname} onClick={handleLinkClick}>
							Mi perfil
						</MobileNavLink>
						<ThemePreferenceControl className="mt-1" />
						<AuthActions menu />
					</div>
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
					? "bg-[#b79b72]/20 text-[#314156] dark:bg-[#b79b72]/30 dark:text-white"
					: "text-gray-600 hover:bg-[#b79b72]/10 hover:text-[#314156] dark:text-gray-300 dark:hover:bg-[#b79b72]/20 dark:hover:text-white"
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
					? "bg-[#b79b72]/20 text-[#314156] dark:bg-[#b79b72]/30 dark:text-white"
					: "text-gray-600 hover:bg-[#b79b72]/10 hover:text-[#314156] dark:text-gray-300 dark:hover:bg-[#b79b72]/20 dark:hover:text-white"
			}`}
		>
			{children}
		</Link>
	);
};

export default Navbar;
