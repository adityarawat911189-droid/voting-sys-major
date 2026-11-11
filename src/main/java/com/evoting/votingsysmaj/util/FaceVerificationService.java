package com.evoting.votingsysmaj.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class FaceVerificationService {

    public enum Result { MATCH, NO_MATCH, NO_FACE_ID, NO_FACE_SELFIE, BAD_IMAGE }

    public static class FaceServiceException extends RuntimeException {
        public FaceServiceException(String msg, Throwable cause) { super(msg, cause); }
    }

    private final RestTemplate rest;
    private final String baseUrl;

    public FaceVerificationService(@Value("${face.service.url}") String baseUrl) {
        this.baseUrl = baseUrl;
        SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(5000);
        f.setReadTimeout(120000); // face detect + 4 rotations me time lagta hai
        this.rest = new RestTemplate(f);
    }

    public Result verify(byte[] idImage, byte[] selfie) {
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("idImage", file(idImage, "id.jpg"));
        body.add("selfie", file(selfie, "selfie.jpg"));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> res = rest.postForObject(
                    baseUrl + "/verify-face", new HttpEntity<>(body, headers), Map.class);
            if (res == null || res.get("status") == null) {
                throw new FaceServiceException("Empty response from face service", null);
            }
            return Result.valueOf(res.get("status").toString());
        } catch (RestClientException | IllegalArgumentException e) {
            throw new FaceServiceException("Face service failed", e);
        }
    }

    private ByteArrayResource file(byte[] data, String name) {
        return new ByteArrayResource(data) {
            @Override public String getFilename() { return name; }
        };
    }
}