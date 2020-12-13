FROM mongo:4.2.11-bionic

RUN apt-get update && apt-get install --yes wget unzip;

COPY ["./main.sh", "./old.data-6-structure-3.json.zip", "/"]

ENTRYPOINT ["/bin/bash"]

CMD ["/main.sh"]
