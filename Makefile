install: requirements.in
	uv pip compile requirements.in | uv pip sync -
