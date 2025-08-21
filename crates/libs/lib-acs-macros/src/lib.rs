use proc_macro::TokenStream;
use quote::quote;
use syn::punctuated::Punctuated;
use syn::Token;
use syn::{parse_macro_input, Expr, ItemFn, Type};

fn can_serialize(ty: &Type) -> bool {
	let test_code = quote! {
		fn test_serialize<T: serde::Serialize>(_: &T) {}
		test_serialize::<#ty>;
	};

	syn::parse2::<proc_macro2::TokenStream>(test_code).is_ok()
}

#[proc_macro_attribute]
pub fn privileges(attr: TokenStream, item: TokenStream) -> TokenStream {
	let mut input_fn = parse_macro_input!(item as ItemFn);
	let fn_block = &input_fn.block;
	let fn_name = &input_fn.sig.ident;

	// Parse the attribute tokens (privileges only)
	let attr_args = if attr.is_empty() {
		Punctuated::<Expr, Token![,]>::new()
	} else {
		parse_macro_input!(attr with Punctuated::<Expr, Token![,]>::parse_terminated)
	};
	let privileges: Vec<Expr> = attr_args.into_iter().collect();

	// Extract the first two function arguments (ctx and mm)
	if input_fn.sig.inputs.len() < 2 {
		panic!("Function must have at least two arguments (ctx and mm)");
	}

	let first_arg = &input_fn.sig.inputs[0];
	let second_arg = &input_fn.sig.inputs[1];
	let third_arg = if input_fn.sig.inputs.len() > 2 {
		Some(&input_fn.sig.inputs[2])
	} else {
		None
	};

	let ctx_ident = match first_arg {
		syn::FnArg::Typed(pat_type) => match &*pat_type.pat {
			syn::Pat::Ident(pat_ident) => &pat_ident.ident,
			_ => panic!("Expected first argument to be a simple identifier"),
		},
		_ => panic!("Expected first argument to be typed"),
	};

	let mm_ident = match second_arg {
		syn::FnArg::Typed(pat_type) => match &*pat_type.pat {
			syn::Pat::Ident(pat_ident) => &pat_ident.ident,
			_ => panic!("Expected second argument to be a simple identifier"),
		},
		_ => panic!("Expected second argument to be typed"),
	};

	let third_ident_type = match third_arg {
		Some(syn::FnArg::Typed(pat_type)) => match &*pat_type.pat {
			syn::Pat::Ident(pat_ident) => Some((&pat_type.ty, &pat_ident.ident)),
			_ => None,
		},
		_ => None,
	};

	let generated_code = match third_ident_type {
		Some((typ, ident)) => {
			let type_str = quote!(#typ).to_string();
			if can_serialize(typ) && !type_str.contains("Filter") {
				quote! {
					let value = serde_json::to_value(&#ident).map_err(|_|crate::model::Error::AccessForJsonConvert)?;
					extra_value.insert("data".to_string(), value);
				}
			} else {
				quote! {}
			}
		}
		None => quote! {},
	};

	let new_block = quote! {
		{
			let accesses = vec![#(#privileges),*];
			let mut extra_value = serde_json::Map::new();
			#generated_code

			let full_name = std::any::type_name::<Self>();
			let method_ref = MethodRef {
				table: Self::TABLE.to_string(),
				method: stringify!(#fn_name).to_string(),
				struct_name: full_name.to_string(),
			};

			match crate::model::acs::access::check_access(#ctx_ident, #mm_ident, accesses, extra_value, method_ref).await {
				Ok(()) => #fn_block,
				Err(e) => Err(e),
			}
		}
	};

	input_fn.block = syn::parse2(new_block).unwrap();
	TokenStream::from(quote! { #input_fn })
}
