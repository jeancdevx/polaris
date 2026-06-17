.PHONY: build clean

DIST_DIR := dist
VENV_DIR := .build-venv
PACKAGE  := $(DIST_DIR)/function.zip

build: clean
	mkdir -p $(DIST_DIR)
	python3 -m venv $(VENV_DIR)
	$(VENV_DIR)/bin/pip install --quiet -r src/requirements.txt -t $(DIST_DIR)/
	rm -rf $(VENV_DIR)
	cp src/index.py $(DIST_DIR)/
	cd $(DIST_DIR) && zip -rq function.zip .

clean:
	rm -rf $(DIST_DIR) $(VENV_DIR)
