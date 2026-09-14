"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
	ChevronDownIcon,
	MoonIcon,
	SunIcon,
	UserCircleIcon,
} from "@heroicons/react/24/outline";
import AuthActions from "./AuthActions";
import { useTheme } from "./ThemeContext";

const SECONDARY_ROUTES = ["/biblioteca", "/sugerencias", "/perfil"];

const controlClassName =
	"flex min-h-10 w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-[#314156] transition hover:bg-[#b79b72]/10 hover:text-[#314156] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79b72] dark:text-gray-100 dark:hover:bg-[#b79b72]/20 dark:hover:text-white";

export function ThemeToggleButton({ className = "" }) {
	const { isDarkMode, toggleTheme } = useTheme();
	const label = isDarkMode ? "Usar tema claro" : "Usar tema oscuro";
	const Icon = isDarkMode ? SunIcon : MoonIcon;

	return (
		<button
			type="button"
			onClick={toggleTheme}
			className={`${controlClassName} ${className}`}
			aria-label={label}
		>
			<Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
			<span>{label}</span>
		</button>
	);
}

export default function ProfileMenu() {
	const pathname = usePathname();
	const [isOpen, setIsOpen] = useState(false);
	const menuRef = useRef(null);
	const triggerRef = useRef(null);

	const hasActiveSecondaryRoute = SECONDARY_ROUTES.some(
		(route) => pathname === route || pathname.startsWith(`${route}/`),
	);

	useEffect(() => {
		setIsOpen(false);
	}, [pathname]);

	useEffect(() => {
		if (!isOpen) return undefined;

		const handlePointerDown = (event) => {
			if (!menuRef.current?.contains(event.target)) {
				setIsOpen(false);
			}
		};
		const handleKeyDown = (event) => {
			if (event.key === "Escape") {
				setIsOpen(false);
				triggerRef.current?.focus();
			}
		};

		document.addEventListener("pointerdown", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("pointerdown", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen]);

	const closeMenu = () => setIsOpen(false);

	return (
		<div className="relative" ref={menuRef}>
			<button
				type="button"
				ref={triggerRef}
				onClick={() => setIsOpen((open) => !open)}
				className={`inline-flex min-h-10 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79b72] ${
					hasActiveSecondaryRoute
						? "bg-[#b79b72]/20 text-[#314156] dark:bg-[#b79b72]/30 dark:text-white"
						: "text-gray-600 hover:bg-[#b79b72]/10 hover:text-[#314156] dark:text-gray-300 dark:hover:bg-[#b79b72]/20 dark:hover:text-white"
				}`}
				aria-expanded={isOpen}
				aria-controls="profile-menu"
				aria-haspopup="true"
			>
				<UserCircleIcon className="h-5 w-5" aria-hidden="true" />
				<span>Perfil</span>
				<ChevronDownIcon
					className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
					aria-hidden="true"
				/>
			</button>

			{isOpen ? (
				<div
					id="profile-menu"
					className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl shadow-black/10 dark:border-gray-700 dark:bg-gray-800 dark:shadow-black/30"
				>
					<div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700">
						<p className="text-sm font-semibold text-[#314156] dark:text-gray-100">Perfil y más</p>
						<p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Accesos personales y preferencias</p>
					</div>
					<nav className="p-2" aria-label="Opciones de perfil">
						<ProfileMenuLink href="/biblioteca" pathname={pathname} onClick={closeMenu}>
							Mi biblioteca
						</ProfileMenuLink>
						<ProfileMenuLink href="/sugerencias" pathname={pathname} onClick={closeMenu}>
							Sugerencias
						</ProfileMenuLink>
						<ProfileMenuLink href="/perfil" pathname={pathname} onClick={closeMenu}>
							Mi perfil
						</ProfileMenuLink>
					</nav>
					<div className="space-y-1 border-t border-gray-100 p-2 dark:border-gray-700">
						<ThemeToggleButton />
						<AuthActions menu />
					</div>
				</div>
			) : null}
		</div>
	);
}

function ProfileMenuLink({ href, pathname, onClick, children }) {
	const isActive = pathname === href || pathname.startsWith(`${href}/`);

	return (
		<Link
			href={href}
			onClick={onClick}
			className={`${controlClassName} ${
				isActive ? "bg-[#b79b72]/20 dark:bg-[#b79b72]/30" : ""
			}`}
			aria-current={isActive ? "page" : undefined}
		>
			{children}
		</Link>
	);
}
